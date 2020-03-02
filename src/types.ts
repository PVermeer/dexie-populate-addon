import { UnionizeTuple, Nominal } from 'simplytyped';
import { IndexableType } from 'dexie';
import { PopulateTable } from './populateTable.class';

export interface PopulateOptions<B extends boolean = false> {
    shallow: B;
}

/**
 * Ref nominal type.
 * TS does not support nominal types. Fake implementation so the type system can match.
 */
export type Ref<O extends object, K extends IndexableType, _N = 'Ref'> = NominalT<O> | K;

/**
 * Overwrite the return type to the type as given in the Ref type after refs are populated.
 */
export type Populated<T, B extends boolean, O extends string[] = string[]> = {

    // Check for nominal Ref on properties:
    [P in keyof T]: T[P] extends Ref<infer X, infer Y, infer N> ?
    N extends 'Ref' ?

    // Check for partial population:
    P extends UnionizeTuple<O> ?

    // Overwrite the properties where ref is found:
    RecursivePopulate<B, X, O>

    // Else use index type
    : Y extends any[] ? Y : Y | null

    // Final use original type
    : T[P] : T[P]
};

declare module 'dexie' {

    interface Table<T, TKey> {
        /**
         * Use Table populate methods
         *
         * Uses Table.methods with populate options.
         */
        // populate<B extends boolean = false>(keys: string[], options?: PopulateOptions<B>): PopulateTable<T, TKey, B>;
        // populate<B extends boolean = false>(options?: PopulateOptions<B>): PopulateTable<T, TKey, B>;

        populate<B extends boolean = false>(
            keysOrOptions?: string[] | PopulateOptions<B>
        ): PopulateTable<T, TKey, B>;
    }

}

type NominalRef<T, R extends string = 'Ref'> = Nominal<T, R>;
type NominalT<T> = T extends any[] ? { [P in keyof T]: NominalRef<T[P]> | null } : NominalRef<T> | null;


type RecursivePopulate<B extends boolean, X, O extends string[]> =
    // Check if shallow is true:
    B extends true ?

    X extends any[] ? { [K in keyof X]: X[K] | null } : X | null
    :
    X extends any[] ? { [K in keyof X]: Populated<X[K] | null, B, O> | null } : Populated<X | null, B, O>;

