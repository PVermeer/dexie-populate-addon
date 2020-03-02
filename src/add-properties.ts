// tslint:disable: space-before-function-paren
import Dexie, { Table } from 'dexie';
import { PopulateTable } from './populateTable.class';
import { RelationalDbSchema } from './schema-parser';
import { PopulateOptions } from './types';

export function addPopulate(db: Dexie, relationalSchema: RelationalDbSchema) {

    // Clone the Table class to override methods that populate relations.
    Object.defineProperty(db.Table.prototype, 'populate', {
        value(this: Table<any, any>, keysOrOptions: string[] | PopulateOptions) {
            return new PopulateTable(keysOrOptions, db, this, relationalSchema);
        }
    });

}
