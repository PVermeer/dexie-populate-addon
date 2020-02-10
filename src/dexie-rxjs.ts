import { Dexie } from 'dexie';
import { addGet } from './add-properties';

declare module 'dexie' {
    namespace Dexie {
        interface Table<T, Key> {
            /**
             * Get all populated records from this table.
             *
             * Uses Table.toArray().
             */
            populate(): T[];
        }
        namespace Table.get {
            const populate: <T>() => T;
        }
        // interface Collection<T, Key> {
        //     /**
        //      * Get all populated records from this where() call.
        //      *
        //      * Uses Collection.toArray().
        //      */
        //     populate: Observable<T[]>;
        // }
    }
}

export function dexieRxjs(db: Dexie) {

    addGet(db);

}
