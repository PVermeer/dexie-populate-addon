// tslint:disable: unified-signatures
import Dexie, { ThenShortcut, IndexableType } from 'dexie';
import 'dexie';
import { ModifiedKeysTable, ModifiedKeys } from './schema-parser';
import { cloneDeep } from 'lodash';

interface MappedIds {
    [targetTable: string]: {
        [targetKey: string]: {
            id: IndexableType;
            index: number;
            key: string
        }[];
    };
}

class Populated<T> {

    private _populated: T[];

    public original() { return this._records; }
    public populated() { return this._populated; }

    public async construct() {

        // Collect all target id's per target table per target key to optimise db queries.
        const mappedIds = this._records.reduce<MappedIds>((acc, record, index) => {

            // Gather all id's per target key
            Object.entries(record).forEach(([key, entry]) => {

                if (!this._relationalSchema[key]) { return; }
                const { targetTable, targetKey } = this._relationalSchema[key];

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
                            const recordKey = this._records[entry.index][entry.key];

                            const newRecordKey = Array.isArray(recordKey) ?
                                results.filter(result => recordKey.includes(result[targetKey])) :
                                results.find(result => result[targetKey] === recordKey) || null;

                            // Update the key with found records
                            this._populated[entry.index][entry.key] = newRecordKey;
                            console.log(recordKey);
                        });
                    });

                acc.push(promise);
            });

            return acc;
        }, []));

        console.log(this);
        return this;
    }

    constructor(
        private _records: T[],
        private _db: Dexie,
        private _relationalSchema: ModifiedKeys
    ) {
        this._populated = cloneDeep(_records);
     }

}

export class TablePopulate<T, Key> {

    private _relationalSchema: ModifiedKeys;

    // --- Overloads
    public async get(key: Key): Promise<Populated<T> | undefined>;
    public async get<R>(key: Key, thenShortcut: ThenShortcut<T | undefined, R>): Promise<Populated<R>>;
    public async get(equalityCriterias: { [key: string]: IndexableType }): Promise<Populated<T> | undefined>;
    public async get<R>(
        equalityCriterias: { [key: string]: IndexableType }, thenShortcut: ThenShortcut<T | undefined, R>
    ): Promise<Populated<R>>;
    // ---------

    public async get<R>(
        keyOrEqualityCriterias: Key | { [key: string]: IndexableType },
        cb?: ThenShortcut<T | undefined, R>
    ) {
        // Types don't match because of missing full overload in Dexie.js, so any for now. Will PR a fix.
        const get = await this._table.get(keyOrEqualityCriterias as any, cb as any);
        if (!get) { return get; }

        return new Populated([get], this._db, this._relationalSchema).construct();
    }

    constructor(
        private _db: Dexie,
        private _table: Dexie.Table<T, Key>,
        relationalSchema: ModifiedKeysTable,
    ) {
        this._relationalSchema = relationalSchema[_table.name];
    }

}
