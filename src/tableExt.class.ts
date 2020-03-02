import { TableSchema, Transaction } from 'dexie';
import { PopulateTable } from './populateTable.class';
import { DexieExt, PopulateOptions } from './types';

export interface TableExtended<T, TKey> {
    populate<B extends boolean = false>(keysOrOptions?: string[] | PopulateOptions<B>): PopulateTable<T, TKey, B>;
}

export function getTableExtended<T, TKey>(db: DexieExt): TableExtended<T, TKey> {

    const TableClass = db.Table;

    class TableExt extends TableClass<T, TKey> {

        private _relationalSchema = db._relationalSchema;

        /**
         * Use Table populate methods
         *
         * Uses Table.methods with populate options.
         */
        // populate<B extends boolean = false>(keys: string[], options?: PopulateOptions<B>): PopulateTable<T, TKey, B>;
        // populate<B extends boolean = false>(options?: PopulateOptions<B>): PopulateTable<T, TKey, B>;

        public populate<B extends boolean = false>(
            keysOrOptions?: string[] | PopulateOptions<B>
        ): PopulateTable<T, TKey, B> {
            return new PopulateTable(keysOrOptions, db, this, this._relationalSchema);
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
