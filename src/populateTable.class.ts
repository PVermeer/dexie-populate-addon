// tslint:disable: unified-signatures
// tslint:disable: space-before-function-paren
import Dexie, { Collection, IndexableType, PromiseExtended, Table, ThenShortcut, WhereClause } from 'dexie';
import { Populate, Populated } from './populate.class';
import { CollectionPopulatedClass } from './populateCollection.class';
import { RelationalDbSchema } from './schema-parser';

export class PopulateTable<T, Key> {

    get(key: Key): PromiseExtended<Populated<T> | undefined>;
    get<R>(key: Key, thenShortcut: ThenShortcut<Populated<T> | undefined, R>): PromiseExtended<R>;
    get(equalityCriterias: { [key: string]: IndexableType }): PromiseExtended<Populated<T> | undefined>;
    get<R>(
        equalityCriterias: { [key: string]: IndexableType },
        thenShortcut: ThenShortcut<Populated<T> | undefined, R>
    ): PromiseExtended<R>;

    public get<R>(
        keyOrequalityCriterias: Key | { [key: string]: IndexableType },
        thenShortcut: ThenShortcut<Populated<T> | undefined, R> = (value: any) => value
    ): PromiseExtended<R | undefined> {

        // Not using async / await so PromiseExtended is returned
        return this._table.get(keyOrequalityCriterias)
            .then(result => {
                const populatedClass = new Populate<T>([result], this._db, this._table, this._relationalSchema);
                return populatedClass.populated;
            })
            .then(popResults => popResults[0])
            .then(popResult => thenShortcut(popResult));

    }


    where(index: string | string[]): WhereClause<Populated<T>, Key>;
    where(equalityCriterias: { [key: string]: IndexableType }): Collection<Populated<T>, Key>;

    public where(
        indexOrequalityCriterias: string | string[] | { [key: string]: IndexableType }
    ): WhereClause<T, Key> | Collection<T, Key> {

        // Get a new WhereClause
        const whereClause = this._table.where(indexOrequalityCriterias as any);

        // Create an extended Collection class that populate results
        const CollectionPopulated = CollectionPopulatedClass(whereClause, this._db, this._table, this._relationalSchema);

        // Override the Collection getter to return the new class
        Object.defineProperty(whereClause, 'Collection', {
            get(this) { return CollectionPopulated; }
        });

        return whereClause;
    }

    constructor(
        private _db: Dexie,
        private _table: Table<any, any>,
        private _relationalSchema: RelationalDbSchema
    ) { }

}
