// tslint:disable: space-before-function-paren // Conflict with default formatter vscode
// tslint:disable: unified-signatures
import Dexie, { IndexableType } from 'dexie';
import { Nominal } from 'simplytyped';
import { addPopulate } from './add-properties';
import { PopulateTable } from './populateTable.class';
import { RelationalDbSchema, SchemaParser, StoreSchemas } from './schema-parser';

/**
 * Ref nominal type.
 * TS does not support nominal types. Fake implementation so the type system can match.
 */
export type Ref<O extends object, K extends IndexableType, _N = 'Ref'> = Nominal<O, 'Ref'> | K;

declare module 'dexie' {

    interface Table<T, TKey> {
        /**
         * Use Table populate methods
         *
         * Uses Table.methods with populate options.
         */
        populate(): PopulateTable<T, TKey>;
    }

}

export function populate(db: Dexie) {

    // Get the relational keys from the schema and return the function with a clean schema.
    let relationalSchema: RelationalDbSchema = {};
    (db.Version.prototype as any)._parseStoresSpec = Dexie.override(
        (db.Version.prototype as any)._parseStoresSpec,
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
