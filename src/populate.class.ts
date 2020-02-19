// tslint:disable: unified-signatures
import 'dexie';
import Dexie, { IndexableType, Table } from 'dexie';
import { cloneDeep } from 'lodash';
import { Ref } from './populate';
import { RelationalDbSchema } from './schema-parser';

interface MappedIds {
    [targetTable: string]: {
        [targetKey: string]: {
            id: IndexableType;
            index: number;
            key: string
        }[];
    };
}

/**
 * Overwrite the return type to the type as given in the Ref type after refs are populated.
 */
export type Populated<T> = {
    [P in keyof T]: T[P] extends Ref<infer X, infer _Y, infer N> ?
    N extends 'Ref' ?
    X : T[P] : T[P]
};

export class Populate<T> {

    private _populated: Populated<T>[];

    /**
     * Get populated documents.
     * @returns Memoized results.
     */
    get populated() {
        return (async () => {
            if (!this._populated) { await this.populateRecords(); }
            return this._populated;
        })();
    }

    /**
     * Get populated documents.
     * @returns Fresh results.
     */
    public async populateRecords() {

        const records = await this._records;

        const populated = cloneDeep(records);
        const schema = this._relationalSchema[this._table.name];

        // Collect all target id's per target table per target key to optimise db queries.
        const mappedIds = records.reduce<MappedIds>((acc, record, index) => {

            if (!record) { return acc; }

            // Gather all id's per target key
            Object.entries(record).forEach(([key, entry]) => {

                if (!schema[key]) { return; }
                const { targetTable, targetKey } = schema[key];

                if (!acc[targetTable]) { acc[targetTable] = {}; }
                if (!acc[targetTable][targetKey]) { acc[targetTable][targetKey] = []; }

                const ids = Array.isArray(entry) ? entry : [entry];
                const mappedIdEntries = ids.map(id => ({ id, index, key }));

                acc[targetTable][targetKey] = [...acc[targetTable][targetKey], ...mappedIdEntries];
            });

            return acc;
        }, {});

        // Fetch all records
        await Promise.all(Object.entries(mappedIds).reduce<Promise<any>[]>((acc, [targetTable, targetKeys]) => {

            Object.entries(targetKeys).forEach(([targetKey, entries]) => {

                const uniqueIds = [...new Set(entries.map(id => id.id))];

                // Get results
                const promise = this._db.table(targetTable).
                    where(targetKey)
                    .anyOf(uniqueIds as any) // Should be fixed in Dexie v3
                    .toArray()

                    // Set the result on the populated record
                    .then(results => {
                        entries.forEach(entry => {
                            const record = records[entry.index];
                            const popRecord = populated[entry.index];
                            if (!record || !popRecord) { return; }
                            const recordKey = record[entry.key];

                            const newRecordKey = Array.isArray(recordKey) ?
                                results.filter(result => recordKey.includes(result[targetKey])) :
                                results.find(result => result[targetKey] === recordKey) || null;

                            // Update the key with found records
                            popRecord[entry.key] = newRecordKey;
                        });
                    });

                acc.push(promise);
            });

            return acc;
        }, []));

        this._populated = populated as Populated<T>[];
        return this._populated;
    }

    constructor(
        private _records: (any)[],
        private _db: Dexie,
        private _table: Table<any, any>,
        private _relationalSchema: RelationalDbSchema
    ) { }

}
