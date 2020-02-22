// tslint:disable: unified-signatures
// tslint:disable: space-before-function-paren
import Dexie, { IndexableType, PromiseExtended, Table, ThenShortcut, WhereClause } from 'dexie';
import { PopulateOptions } from './populate';
import { Populate, Populated } from './populate.class';
import { CollectionPopulated, getCollectionPopulated } from './populateCollection.class';
import { RelationalDbSchema } from './schema-parser';

export class PopulateTable<T, TKey> {

    get(key: TKey): PromiseExtended<Populated<T> | undefined>;
    get<R>(key: TKey, thenShortcut: ThenShortcut<Populated<T> | undefined, R>): PromiseExtended<R>;
    get(equalityCriterias: { [key: string]: IndexableType }): PromiseExtended<Populated<T> | undefined>;
    get<R>(
        equalityCriterias: { [key: string]: IndexableType },
        thenShortcut: ThenShortcut<Populated<T> | undefined, R>
    ): PromiseExtended<R>;

    public get<R>(
        keyOrequalityCriterias: TKey | { [key: string]: IndexableType },
        thenShortcut: ThenShortcut<Populated<T> | undefined, R> = (value: any) => value
    ): PromiseExtended<R | undefined> {

        // Not using async / await so PromiseExtended is returned
        return this._table.get(keyOrequalityCriterias)
            .then(result => {
                const populatedClass = new Populate<T>([result], this._keysOrOptions, this._db, this._table, this._relationalSchema);
                return populatedClass.populated;
            })
            .then(popResults => popResults[0])
            .then(popResult => thenShortcut(popResult));

    }


    where(index: string | string[]): WhereClause<Populated<T>, TKey>;
    where(equalityCriterias: { [key: string]: IndexableType }): CollectionPopulated<Populated<T>, TKey>;

    public where(
        indexOrequalityCriterias: string | string[] | { [key: string]: IndexableType }
    ): WhereClause<T, TKey> | CollectionPopulated<Populated<T>, TKey> {

        const whereClause = this._table.where(indexOrequalityCriterias as any);
        const collectionPopulated = getCollectionPopulated<T, TKey>(
            whereClause,
            this._keysOrOptions,
            this._db,
            this._table,
            this._relationalSchema
        );

        // Override the Collection getter to return the new class
        Object.defineProperty(whereClause, 'Collection', {
            get(this) { return collectionPopulated; }
        });

        return whereClause;
    }

    /**
     * @warning Potentially very slow.
     */
    public each(
        callback: (obj: Populated<T>, cursor: { key: IndexableType, primaryKey: TKey }) => any
    ): PromiseExtended<void> {
        const records: T[] = [];
        const cursors: { key: IndexableType, primaryKey: TKey }[] = [];
        return this._table.each((x, y) => records.push(x) && cursors.push(y))
            .then(async () => {
                const populatedClass = new Populate<T>(records, this._keysOrOptions, this._db, this._table, this._relationalSchema);
                const recordsPop = await populatedClass.populated;
                recordsPop.forEach((x, i) => callback(x, cursors[i]));
                return;
            });
    }

    constructor(
        private _keysOrOptions: string[] | PopulateOptions,
        private _db: Dexie,
        private _table: Table<any, any>,
        private _relationalSchema: RelationalDbSchema
    ) { }

}
