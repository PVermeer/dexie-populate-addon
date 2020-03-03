import { TableSchema, Transaction } from 'dexie';
import { PopulateTable } from './populateTable.class';
import { DexieExt, PopulateOptions } from './types';

// tslint:disable: unified-signatures
export interface TableExtended<T, TKey> {
    /**
     * Use Table populate methods
     *
     * Uses Table.methods with populate options.
     */
    populate<B extends boolean = false, K extends string = string>(keys: K[], options?: PopulateOptions<B>): PopulateTable<T, TKey, B, K>;
    populate<B extends boolean = false>(options?: PopulateOptions<B>): PopulateTable<T, TKey, B, string>;
    populate<B extends boolean = false, K extends string = string>(keysOrOptions?: K[] | PopulateOptions<B>): PopulateTable<T, TKey, B, K>;
}
// tslint:enable: unified-signatures

export function getTableExtended<T, TKey>(db: DexieExt): TableExtended<T, TKey> {

    const TableClass = db.Table;

    class TableExt extends TableClass<T, TKey> {

        private _relationalSchema = db._relationalSchema;

        public populate<B extends boolean = false, K extends string = string>(
            keysOrOptions?: K[] | PopulateOptions<B>
        ): PopulateTable<T, TKey, B, K> {
            return new PopulateTable<T, TKey, B, K>(keysOrOptions, db, this, this._relationalSchema);
        }

        constructor(
            _name: string,
            _tableSchema: TableSchema,
            _optionalTrans?: Transaction
        ) {
            super(_name, _tableSchema, _optionalTrans);
        }

    }

    // Generating declarations will error when class is dynamically contructed, so any.
    return TableExt as any;
}
