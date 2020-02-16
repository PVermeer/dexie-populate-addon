// tslint:disable: unified-signatures
import 'dexie';
import Dexie, { IndexableType } from 'dexie';
import { cloneDeep } from 'lodash';
import { ModifiedKeysTable } from './schema-parser';

interface MappedIds {
    [targetTable: string]: {
        [targetKey: string]: {
            id: IndexableType;
            index: number;
            key: string
        }[];
    };
}

export class Populate<T> {

    private _populated: T[];

    get populated() {
        return (async () => {
            if (!this._populated) { await this.populateRecords(); }
            return this._populated;
        })();
    }

    public async populateRecords() {

        const records = await this._records;

        const populated = cloneDeep(records);
        const schema = this._relationalSchema[this._table.name];

        // Collect all target id's per target table per target key to optimise db queries.
        const mappedIds = records.reduce<MappedIds>((acc, record, index) => {

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
                            const recordKey = records[entry.index][entry.key];

                            const newRecordKey = Array.isArray(recordKey) ?
                                results.filter(result => recordKey.includes(result[targetKey])) :
                                results.find(result => result[targetKey] === recordKey) || null;

                            // Update the key with found records
                            populated[entry.index][entry.key] = newRecordKey;
                        });
                    });

                acc.push(promise);
            });

            return acc;
        }, []));

        this._populated = populated;
        return this._populated;
    }

    constructor(
        private _records: Promise<T[]> | T[],
        private _db: Dexie,
        private _table: Dexie.Table<T, IndexableType>,
        private _relationalSchema: ModifiedKeysTable
    ) { }

}
