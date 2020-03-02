// tslint:disable: unified-signatures
// tslint:disable: space-before-function-paren
import Dexie, { IndexableType, PromiseExtended, Table, ThenShortcut, WhereClause } from 'dexie';
import { Populate } from './populate.class';
import { CollectionPopulated, getCollectionPopulated } from './populateCollection.class';
import { RelationalDbSchema } from './schema-parser';
import { Populated, PopulateOptions } from './types';

export class PopulateTable<T, TKey, B extends boolean> {

    get(key: TKey): PromiseExtended<Populated<T, B> | undefined>;
    get<R>(key: TKey, thenShortcut: ThenShortcut<Populated<T, B> | undefined, R>): PromiseExtended<R>;
    get(equalityCriterias: { [key: string]: IndexableType }): PromiseExtended<Populated<T, B> | undefined>;
    get<R>(
        equalityCriterias: { [key: string]: IndexableType },
        thenShortcut: ThenShortcut<Populated<T, B> | undefined, R>
    ): PromiseExtended<R>;

    public get<R>(
        keyOrequalityCriterias: TKey | { [key: string]: IndexableType },
        thenShortcut: ThenShortcut<Populated<T, B> | undefined, R> = (value: any) => value
    ): PromiseExtended<R | undefined> {

        // Not using async / await so PromiseExtended is returned
        return this._table.get(keyOrequalityCriterias)
            .then(result => {
                const populatedClass = new Populate<T, B>([result], this._keysOrOptions, this._db, this._table, this._relationalSchema);
                return populatedClass.populated;
            })
            .then(popResults => popResults[0])
            .then(popResult => thenShortcut(popResult));
    }


    where(index: string | string[]): WhereClause<Populated<T, B>, TKey>;
    where(equalityCriterias: { [key: string]: IndexableType }): CollectionPopulated<Populated<T, B>, TKey>;

    public where(
        indexOrequalityCriterias: string | string[] | { [key: string]: IndexableType }
    ): WhereClause<T, TKey> | CollectionPopulated<Populated<T, B>, TKey> {

        const whereClause = this._table.where(indexOrequalityCriterias as any);
        const collectionPopulated = getCollectionPopulated<T, TKey, B>(
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
        callback: (obj: Populated<T, B>, cursor: { key: IndexableType, primaryKey: TKey }) => any
    ): PromiseExtended<void> {
        const records: T[] = [];
        const cursors: { key: IndexableType, primaryKey: TKey }[] = [];
        return this._table.each((x, y) => records.push(x) && cursors.push(y))
            .then(async () => {
                const populatedClass = new Populate<T, B>(records, this._keysOrOptions, this._db, this._table, this._relationalSchema);
                const recordsPop = await populatedClass.populated;
                recordsPop.forEach((x, i) => callback(x, cursors[i]));
                return;
            });
    }

    constructor(
        private _keysOrOptions: string[] | PopulateOptions<B>,
        private _db: Dexie,
        private _table: Table<any, any>,
        private _relationalSchema: RelationalDbSchema
    ) { }

}
