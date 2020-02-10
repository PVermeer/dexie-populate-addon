// tslint:disable: space-before-function-paren
// tslint:disable: object-literal-shorthand
import { Dexie } from 'dexie';

type TableExtended = Dexie.Table<any, any> & {
};
// type CollectionExtended = Dexie.Collection<any, any> & {
//     _ctx: {
//         table: Dexie.Table<any, any>;
//     };
// };

/** @internal */
export function addGet(db: Dexie) {

    Object.defineProperty(db.Table.prototype.get, 'populate', {
        value: function (
            this: TableExtended,
        ) {

        }
    });
}
