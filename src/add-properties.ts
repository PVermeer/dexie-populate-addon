// tslint:disable: space-before-function-paren
import Dexie from 'dexie';
import { ModifiedKeysTable } from './schema-parser';
import { TablePopulate } from './populate.class';

/** @internal */
export function addPopulate(db: Dexie, relationalSchema: ModifiedKeysTable) {

    Object.defineProperty(db.Table.prototype, 'populate', {
        value(this: Dexie.Table<any, any>) { return new TablePopulate(db, this, relationalSchema); }
    });

}
