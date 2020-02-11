// tslint:disable: space-before-function-paren // Conflict with default formatter vscode
// tslint:disable: unified-signatures
import Dexie from 'dexie';
import { addPopulate } from './add-properties';
import { ModifiedKeysTable, SchemaParser, StoreSchemas } from './schema-parser';
import { TablePopulate } from './populate.class';

declare module 'dexie' {
    type ThenShortcut<T, TResult> = (value: T) => TResult | PromiseLike<TResult>;

    namespace Dexie {
        interface Table<T, Key> {
            /**
             * Use Table populate methods
             *
             * Uses Table.methods with populate options.
             */
            populate: () => TablePopulate<T, Key>;
        }
    }
}

export function populate(db: Dexie) {

    // Get the relational keys from the schema and return the function with a clean schema.
    let relationalSchema: ModifiedKeysTable = {};
    db.Version.prototype._parseStoresSpec = Dexie.override(
        db.Version.prototype._parseStoresSpec,
        (origFunc) =>

            function (this: any, storesSpec: StoreSchemas, outSchema: any) {
                const parser = new SchemaParser(storesSpec);
                const relationalKeys = parser.getRelationalKeys();
                const cleanedSchema = parser.getCleanedSchema();

                relationalSchema = relationalKeys;

                // Return the original function with cleaned schema.
                return origFunc.apply(this, [cleanedSchema, outSchema]);
            });

    db.on('ready', () => {

        if (!relationalSchema || !Object.keys(relationalSchema).length) {
            console.warn('DEXIE POPULATE: No relational keys are set');
        }

        addPopulate(db, relationalSchema);

    });

}
