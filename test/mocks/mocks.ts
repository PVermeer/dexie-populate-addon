import Dexie from 'dexie';
import faker from 'faker/locale/nl';
import { populate } from '../../src/populate';

export interface Friend {
    id?: number;
    testProp?: string;
    hasAge?: boolean;
    firstName: string;
    lastName: string;
    shoeSize: number;
    customId: number;
    some?: { id: number; };
    hasFriends: number[];
}

type TestDatabaseType = Dexie & { friends: Dexie.Table<Friend, number> };

export const databasesPositive = [
    {
        desc: 'TestDatabase',
        db: (dexie: typeof Dexie) => new class TestDatabase extends dexie {
            public friends: Dexie.Table<Friend, number>;
            constructor(name: string) {
                super(name);
                populate(this);
                this.on('blocked', () => false);
                this.version(1).stores({
                    friends: '++id, customId, firstName, lastName, shoeSize, age, hasFriends => friends.id'
                });
            }
        }('TestDatabase')
    }
];

export const databasesNegative = [];

export const methods: { desc: string, method: (db: TestDatabaseType) => (id: number) => Promise<Friend> }[] = [
    {
        desc: 'Table.get().populate()',
        method: db => id => db.friends.populate().get(id).then(x => x.populated()[0])
    }
];

export const mockFriends = (count: number = 5): Friend[] => {
    const friend = () => ({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        age: faker.random.number({ min: 1, max: 80 }),
        shoeSize: faker.random.number({ min: 5, max: 12 }),
        customId: faker.random.number({ min: 1000000, max: 9999999 }),
        hasFriends: []
    });
    return new Array(count).fill(null).map(() => friend());
};
