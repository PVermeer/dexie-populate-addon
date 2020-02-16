// tslint:disable: space-before-function-paren
import Dexie from 'dexie';
import { ModifiedKeysTable } from './schema-parser';
import { Populate } from './populate.class';

interface DexieExtended extends Dexie {
    TablePopulated: new (name: string) => Dexie.Table<any, any>;
}
interface TableExtended extends Dexie.Table<any, any> {
    _populateTable: Dexie.Table<any, any>;
}

// const a = new this.constructor(this.name);

/** @internal */
export function addPopulate(db: Dexie, relationalSchema: ModifiedKeysTable) {

    const dbExt = db as DexieExtended;

    // Clone the Table class to override methods that populate relations.
    Object.defineProperties(dbExt.Table.prototype, {
        populate: {
            value(this: TableExtended) {
                if (!this._populateTable) {

                    const proto = Object.getPrototypeOf(this);
                    this._populateTable = Object.assign(Object.create(proto), this);

                    // Override get methods with populate
                    ['get', 'bulkGet'].forEach(name => {
                        Object.defineProperty(this._populateTable, name, {
                            value: async (...args: any[]) => {
                                const result: object[] = await this[name](...args)
                                    .then((x: object | object[]) => Array.isArray(x) ? x : [x]);
                                const populated = await new Populate(result, db, this, relationalSchema).populated;
                                return populated;
                            }
                        });
                    });
                }
                return this._populateTable;
            }
        }
    });

}
