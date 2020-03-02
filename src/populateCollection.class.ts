// tslint:disable: space-before-function-paren
import { Collection, IndexableType, KeyRange, PromiseExtended, Table, ThenShortcut, WhereClause } from 'dexie';
import { Populate } from './populate.class';
import { RelationalDbSchema } from './schema-parser';
import { DexieExt, Populated, PopulateOptions } from './types';

// Interfaces to extend Dexie declarations. A lot of properties are not exposed :(
interface WhereClauseExt extends WhereClause {
    Collection: new <T, TKey>(whereClause?: WhereClause | null, keyRangeGenerator?: () => KeyRange) => Collection<T, TKey>;
}

export interface CollectionPopulated<T, TKey> extends Collection<T, TKey> { }

/**
 * Dexie.js is actively hiding classes and only exports interfaces
 * but extention is possible from the getter in the WhereClause.
 * From here the Collection class can be extended to override some methods
 * when table.populate() is called.
 */
export function getCollectionPopulated<M, MKey, B extends boolean>(
    whereClause: WhereClause | null,
    keysOrOptions: string[] | PopulateOptions<B> | undefined,
    db: DexieExt,
    table: Table,
    relationalSchema: RelationalDbSchema
): CollectionPopulated<M, MKey> {

    const whereClauseExt = whereClause as WhereClauseExt;
    const collection = whereClauseExt.Collection;

    /** New collection class where methods are overwritten to support population */
    class CollectionPopulatedClass<T, TKey> extends collection<T, TKey> {

        public toArray<R>(
            thenShortcut: ThenShortcut<Populated<any, B>[], R> = (value: any) => value
        ): PromiseExtended<R> {

            // Not using async / await so PromiseExtended is returned
            return super.toArray()
                .then(results => {
                    const populatedClass = new Populate<T, B>(results, keysOrOptions, db, table, relationalSchema);
                    return populatedClass.populated;
                })
                .then(popResults => thenShortcut(popResults));
        }

        /**
         * @warning Potentially very slow.
         */
        public each(
            callback: (obj: T, cursor: { key: IndexableType, primaryKey: TKey }) => any
        ): PromiseExtended<void> {
            const records: T[] = [];
            const cursors: { key: IndexableType, primaryKey: TKey }[] = [];
            return super.each((x, y) => records.push(x) && cursors.push(y))
                .then(async () => {
                    const populatedClass = new Populate<T, B>(records, keysOrOptions, db, table, relationalSchema);
                    const recordsPop = await populatedClass.populated;
                    recordsPop.forEach((x, i) => callback(x, cursors[i]));
                    return;
                });
        }

        constructor(
            _whereClause?: WhereClause | null,
            _keyRangeGenerator?: () => KeyRange
        ) {
            super(_whereClause, _keyRangeGenerator);
        }
    }

    // Generating declarations will error when class is dynamically contructed, so any.
    return CollectionPopulatedClass as any;
}
