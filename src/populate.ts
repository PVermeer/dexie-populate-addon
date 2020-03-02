// tslint:disable: space-before-function-paren // Conflict with default formatter vscode
// tslint:disable: unified-signatures
import Dexie from 'dexie';
import { addPopulate } from './add-properties';
import { RelationalDbSchema, SchemaParser, StoreSchemas } from './schema-parser';


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

        if (Object.values(relationalSchema).some(table => Object.values(table).some(x => !db[x.targetTable]))) {
            db.close();
            throw new Error('DEXIE POPULATE: Relation schema does not match the db tables');
        }

        addPopulate(db, relationalSchema);

    });

}
