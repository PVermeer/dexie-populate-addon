// tslint:disable: unified-signatures
import 'dexie';
import Dexie, { IndexableType, Table } from 'dexie';
import { cloneDeep, uniqBy } from 'lodash';
import { Ref, PopulateOptions } from './populate';
import { RelationalDbSchema } from './schema-parser';

interface MappedIds {
    [targetTable: string]: {
        [targetKey: string]: {
            id: IndexableType;
            // index: number;
            key: string;
            ref: any;
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
    private _keysToPopulate: string[] | undefined;
    private _options: PopulateOptions | undefined;

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

        const schema = this._relationalSchema[this._table.name];
        const keysToPopulate = this._keysToPopulate || [];

        // Match schema with provided keys
        keysToPopulate.forEach(key => {
            if (!schema[key]) {
                throw new Error(`DEXIE POPULATE: Provided key '${key}' doesn't match with schema`);
            }
        });

        const records = await this._records;
        const populated = cloneDeep(records);

        // Collect all target id's per target table per target key to optimise db queries.
        const mappedIds = populated.reduce<MappedIds>((acc, record) => {

            if (!record) { return acc; }

            // Gather all id's per target key
            Object.entries(record).forEach(([key, entry]) => {

                if (
                    !schema[key] ||
                    keysToPopulate.some(x => x !== key)
                ) { return; }

                const { targetTable, targetKey } = schema[key];

                if (!acc[targetTable]) { acc[targetTable] = {}; }
                if (!acc[targetTable][targetKey]) { acc[targetTable][targetKey] = []; }

                const ids = Array.isArray(entry) ? entry : [entry];
                const mappedIdEntries = ids.map(id => ({ id, key, ref: record }));

                acc[targetTable][targetKey] = [...acc[targetTable][targetKey], ...mappedIdEntries];
            });

            return acc;
        }, {});

        // Fetch all records
        await Promise.all(Object.entries(mappedIds).reduce<Promise<any>[]>((acc, [targetTable, targetKeys]) => {

            Object.entries(targetKeys).forEach(([targetKey, entries]) => {

                const uniqueIds = [...new Set(entries.map(entry => entry.id))];
                const uniqueByRef = uniqBy(entries, value => value.ref);

                // Get results
                const promise = this._db.table(targetTable)
                    .where(targetKey)
                    .anyOf(uniqueIds) // Should be fixed in Dexie v3
                    .toArray()

                    // Set the result on the populated record by reference
                    .then(results => {
                        uniqueByRef.forEach(entry => {
                            const { ref, key } = entry;
                            const refKey = ref[key];

                            const newRefKey = Array.isArray(refKey) ?
                                results.filter(result => refKey.includes(result[targetKey])) :
                                results.find(result => result[targetKey] === refKey) || null;

                            // Update the referenced object with found record(s)
                            ref[key] = newRefKey;
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
        keysOrOptions: string[] | PopulateOptions | undefined,
        private _db: Dexie,
        private _table: Table<any, any>,
        private _relationalSchema: RelationalDbSchema
    ) {
        if (keysOrOptions) {
            if (Array.isArray(keysOrOptions)) {
                this._keysToPopulate = keysOrOptions;
            } else if ('shallow' in keysOrOptions) {
                this._options = keysOrOptions;
            }
        }
    }

}
