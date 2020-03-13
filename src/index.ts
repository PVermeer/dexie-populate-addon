import { WhereClauseExtended } from './populateCollection.class';
import { TableExtended } from './tableExt.class';

export { populate } from './populate';
export { Populate } from './populate.class';
export { WhereClauseExtended } from './populateCollection.class';
export { PopulateTable } from './populateTable.class';
export { TableExtended } from './tableExt.class';

declare module 'dexie' {

    /**
     * Extended Table class with populate methods
     */
    interface Table<T, TKey> extends TableExtended<T, TKey> { }
    interface WhereClause<T, TKey> extends WhereClauseExtended<T, TKey> { }

}
