// tslint:disable: space-before-function-paren
import Dexie from 'dexie';
import { PopulateTable } from './populateTable.class';
import { RelationalDbSchema } from './schema-parser';

export function addPopulate(db: Dexie, relationalSchema: RelationalDbSchema) {

    // Clone the Table class to override methods that populate relations.
    Object.defineProperty(db.Table.prototype, 'populate', {
        value(this: Dexie.Table<any, any>) {
            return new PopulateTable(db, this, relationalSchema);
        }
    });

}
