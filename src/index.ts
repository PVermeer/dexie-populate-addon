/* istanbul ignore file */

import { WhereClauseExtended } from './populate-collection.class';
import { TableExtended } from './table-extended.class';

export { populate } from './populate';
export { WhereClauseExtended } from './populate-collection.class';
export { PopulateTable } from './populate-table.class';
export { Populate } from './populate.class';
export { TableExtended } from './table-extended.class';

declare module 'dexie' {

    /**
     * Extended Table class with populate methods
     */
    interface Table<T, TKey> extends TableExtended<T, TKey> { }
    interface WhereClause<T, TKey> extends WhereClauseExtended<T, TKey> { }

}
