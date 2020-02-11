export interface StoreSchemas { [tableName: string]: string | null; }

export interface ModifiedKeys {
    [prop: string]: {
        targetTable: string;
        targetKey: string;
    };
}

export interface ModifiedKeysTable {
    [prop: string]: ModifiedKeys;
}

export class SchemaParser {

    private schema: StoreSchemas;

    /**
     * Extract the relationial keys from the schema.
     */
    public getRelationalKeys(): ModifiedKeysTable {
        return Object.entries(this.schema).reduce<ModifiedKeysTable>((acc, [table, value]) => {
            if (!value) { return acc; }

            const relationalKeys = value
                .split(',')
                .filter(x => x.includes('=>'))
                .reduce<ModifiedKeys>((relObj, x) => {
                    const split = x.split('=>').map(y => y.trim());
                    const [targetTable, targetKey] = split[1].split('.').map(y => y.trim());
                    return { ...relObj, [split[0]]: { targetTable, targetKey } };
                }, {});

            if (!Object.keys(relationalKeys).length) { return acc; }

            return { ...acc, [table]: relationalKeys };
        }, {});
    }

    /**
     * Create a clean schema without the added keys.
     */
    public getCleanedSchema(): StoreSchemas {
        return Object.entries(this.schema).reduce<StoreSchemas>((acc, [table, value]) => {
            if (!value) { return acc; }

            const sanitized = value
                .split(',')
                .map(x => x.trim().split('=>')[0])
                .join(',');

            return { ...acc, [table]: sanitized };
        }, {});
    }

    constructor(schema: StoreSchemas) {
        this.schema = schema;
    }

}
