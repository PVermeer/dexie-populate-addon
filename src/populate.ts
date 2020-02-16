// tslint:disable: space-before-function-paren // Conflict with default formatter vscode
// tslint:disable: unified-signatures
import Dexie, { IndexableType } from 'dexie';
import { Nominal } from 'simplytyped';
import { addPopulate } from './add-properties';
import { ModifiedKeysTable, SchemaParser, StoreSchemas } from './schema-parser';

/**
 * Ref nominal type.
 * TS does not support nominal types. Fake implementation so the type system can match.
 */
export type Ref<O extends object, K extends IndexableType, _N = 'Ref'> = Nominal<O, 'Ref'> | K;


/** Pick method types of Table */
type PopulatePick<T = object, Key = IndexableType> = Pick<Dexie.Table<T, Key>, 'get'>;

/** Overwrite the return the correct type when refs are populated on picked methods */
type Populate<O, K, Pop = PopulatePick<O, K>> = {
    [P in keyof Pop]:
    Pop[P] extends (...arg: any[]) => any ?
    (...arg: Parameters<Pop[P]>) =>
        Promise<{
            [M in keyof O]: O[M] extends Ref<infer X, infer _Y, infer N> ?
            N extends 'Ref' ?
            X : O[M] : O[M]
        } | undefined>
    : never
};


declare module 'dexie' {

    type ThenShortcut<T, TResult> = (value: T) => TResult | PromiseLike<TResult>;

    namespace Dexie {

        interface Table<T, Key> {

            /** Add to get overloads, this should be the last type that exepts all */
            get<R = T>(
                keyOrequalityCriterias: Key | { [key: string]: any },
                thenShortcut?: ThenShortcut<T | undefined, R>
            ): Dexie.Promise<R>;


            /**
             * Use Table populate methods
             *
             * Uses Table.methods with populate options.
             */
            populate(): Populate<T, Key>;
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
