// tslint:disable: unified-signatures
import Dexie, { IndexableType, ThenShortcut } from 'dexie';
import { Populate, Populated } from './populate.class';
import { RelationalDbSchema } from './schema-parser';

export class PopulateTable<T, Key> {

    get(key: Key): Promise<Populated<T> | undefined>;
    get<R>(key: Key, thenShortcut: ThenShortcut<Populated<T> | undefined, R>): Promise<R>;
    get(equalityCriterias: { [key: string]: IndexableType }): Promise<Populated<T> | undefined>;
    get<R>(equalityCriterias: { [key: string]: IndexableType }, thenShortcut: ThenShortcut<Populated<T> | undefined, R>): Promise<R>;

    public async get<R>(
        keyOrequalityCriterias: Key | { [key: string]: IndexableType },
        thenShortcut?: ThenShortcut<Populated<R> | undefined, Populated<R>>
    ): Promise<Populated<R> | undefined> {
        const result = await this._table.get(keyOrequalityCriterias);
        const populatedClass = new Populate<R>([result], this._db, this._table, this._relationalSchema);
        const [popResult] = await populatedClass.populated;
        if (thenShortcut) { return thenShortcut(popResult); }
        return popResult;
    }

    constructor(
        private _db: Dexie,
        private _table: Dexie.Table<any, any>,
        private _relationalSchema: RelationalDbSchema
    ) { }

}
