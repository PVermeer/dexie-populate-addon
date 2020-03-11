// tslint:disable: unified-signatures
import { Dexie, IndexableType, Table } from 'dexie';
import { cloneDeep, flatten, isEqual, uniqBy } from 'lodash';
import { RelationalDbSchema } from './schema-parser.class';
import { Populated, PopulateOptions } from './types';

interface MappedIds {
    [targetTable: string]: {
        [targetKey: string]: {
            id: IndexableType;
            key: string;
            ref: any;
        }[];
    };
}

export class Populate<T, B extends boolean, K extends string> {

    private _populated: Populated<T, B, K>[];
    private _keysToPopulate: string[] | undefined;
    private _options: PopulateOptions<B> | undefined;

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

        // Match schema with provided keys
        (this._keysToPopulate || []).forEach(key => {
            if (!Object.values(this._relationalSchema).some(x => Object.keys(x).some(y => y === key))) {
                throw new Error(`DEXIE POPULATE: Provided key '${key}' doesn't match with schema`);
            }
        });

        const records = await this._records;
        const populated = cloneDeep(records);

        await this._recursivePopulate(this._table.name, populated);

        this._populated = populated as Populated<T, B, K>[];
        return this._populated;
    }

    /**
     * Recursively populate the provided records.
     */
    private _recursivePopulate = async (tableName: string, populateRefs: any[]) => {

        const schema = this._relationalSchema[tableName];
        if (!schema) { return; }

        const keysToPopulate = this._keysToPopulate || [];
        const deepRefsToPopulate: { [table: string]: any[] } = {};

        // Collect all target id's per target table per target key to optimise db queries.
        const mappedIds = populateRefs.reduce<MappedIds>((acc, record) => {

            if (!record) { return acc; }

            // Gather all id's per target key
            Object.entries(record).forEach(([key, entry]) => {

                if (
                    !schema[key] ||
                    keysToPopulate.length && !keysToPopulate.some(x => x === key) ||
                    !entry
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
                    .anyOf(uniqueIds)
                    .toArray()

                    // Set the result on the populated record by reference
                    .then(results => {
                        uniqueByRef.forEach(entry => {
                            const { ref, key } = entry;
                            const refKey = ref[key];

                            const newRefKey: any = Array.isArray(refKey) ?
                                refKey.map(value => results.find(x => x[targetKey] === value) || null) :
                                results.find(result => result[targetKey] === refKey) || null;

                            // Error checking
                            const isCircular = !newRefKey ? false : Array.isArray(newRefKey) && newRefKey.some(x => x ?
                                isEqual(x[key], ref[key]) : false) ||
                                isEqual(newRefKey[key], ref[key]);

                            if (isCircular) {
                                throw new Error(`DEXIE POPULATE: Circular reference detected on '${key}'. ` +
                                    `'${key}' Probably contains a reference to itself.`
                                );
                            }

                            // Update the referenced object with found record(s)
                            ref[key] = newRefKey;

                            // Push the ref for furter populating
                            if (!deepRefsToPopulate[targetTable]) { deepRefsToPopulate[targetTable] = []; }
                            deepRefsToPopulate[targetTable].push(newRefKey);
                        });
                    });

                acc.push(promise);
            });

            return acc;
        }, []));

        // Return when shallow option is provided.
        if (this._options && this._options.shallow) { return; }

        // Recursively populate refs further per table
        if (Object.keys(deepRefsToPopulate).length) {
            await Promise.all(
                Object.entries(deepRefsToPopulate)
                    /* Using lodash flatten (instead of Array.flat())
                     because Edge just updated to support Array.flat() and MS updates slow */
                    .map(([table, refs]) => this._recursivePopulate(table, flatten(refs)))
            );
        }
    }

    constructor(
        private _records: (any)[],
        keysOrOptions: string[] | PopulateOptions<B> | undefined,
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
