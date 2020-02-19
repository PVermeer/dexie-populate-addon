import Dexie, { Collection, KeyRange, PromiseExtended, Table, ThenShortcut, WhereClause } from 'dexie';
import { Populate, Populated } from './populate.class';
import { RelationalDbSchema } from './schema-parser';

interface WhereClauseExt extends WhereClause {
    Collection: new (whereClause?: WhereClause | null, keyRangeGenerator?: () => KeyRange) => Collection;
}

/**
 * Dexie.js is actively hiding classes and only exports interfaces
 * but extention is possible from the getter in the WhereClause.
 * From here the Collection class can be extended to override some methods
 * when table.populate() is called.
 */
export function CollectionPopulatedClass(
    whereClause: WhereClause | null,
    db: Dexie,
    table: Table,
    relationalSchema: RelationalDbSchema
) {
    const whereClauseExt = whereClause as WhereClauseExt;

    /** New collection class where methods are overwritten to support population */
    class CollectionPopulated extends whereClauseExt.Collection {

        public toArray<R>(
            thenShortcut: ThenShortcut<Populated<any>[], R> = (value: any) => value
        ): PromiseExtended<R> {

            // Not using async / await so PromiseExtended is returned
            return super.toArray()
                .then(results => {
                    const populatedClass = new Populate<any>(results, db, table, relationalSchema);
                    return populatedClass.populated;
                })
                .then(popResults => thenShortcut(popResults));
        }

        constructor(
            _whereClause?: WhereClause | null,
            _keyRangeGenerator?: () => KeyRange
        ) {
            super(_whereClause, _keyRangeGenerator);
        }
    }

    return CollectionPopulated as typeof CollectionPopulated;
}
