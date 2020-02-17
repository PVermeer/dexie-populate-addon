// tslint:disable: unified-signatures
import Dexie, { IndexableType, ThenShortcut } from 'dexie';
import { Populate, Populated } from './populate.class';
import { RelationalDbSchema } from './schema-parser';

export class PopulateTable<T, Key> {

    get(key: Key): Promise<Populated<T> | undefined>;
    get<R>(key: Key, thenShortcut: ThenShortcut<Populated<T> | undefined, Populated<R>>): Promise<Populated<R> | undefined>;
    get(equalityCriterias: { [key: string]: IndexableType }): Promise<Populated<T> | undefined>;
    get<R>(
        equalityCriterias: { [key: string]: IndexableType },
        thenShortcut: ThenShortcut<Populated<T> | undefined, Populated<R>>
    ): Promise<Populated<R> | undefined>;

    public async get<R = T>(
        keyOrequalityCriterias: Key | { [key: string]: IndexableType },
        thenShortcut?: ThenShortcut<Populated<T> | undefined, Populated<R>>
    ): Promise<Populated<R> | undefined> {
        const result = await this._table.get<R>(keyOrequalityCriterias, thenShortcut);
        const populatedClass = new Populate<R>([result], this._db, this._table, this._relationalSchema);
        return populatedClass.populated.then(x => x[0]);
    }

    constructor(
        private _db: Dexie,
        private _table: Dexie.Table<any, any>,
        private _relationalSchema: RelationalDbSchema
    ) { }

}
