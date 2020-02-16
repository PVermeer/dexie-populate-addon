// tslint:disable: no-non-null-assertion
import Dexie from 'dexie';
import faker from 'faker/locale/nl';
import { populate, Ref } from '../../src/populate';

export class Friend {
    id?: number;
    testProp?: string;
    age: number;
    hasAge?: boolean;
    firstName: string;
    lastName: string;
    shoeSize: number;
    customId: number;
    some?: { id: number; };
    hasFriends: Ref<Friend[], number[]>;

    doSomething() {
        return void 0;
    }

    constructor(friend: OmitMethods<Friend>) {
        Object.entries(friend).forEach(([key, value]) => {
            this[key] = value;
        });
    }
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
                this.friends.mapToClass(Friend);
            }
        }('TestDatabase')
    }
];

export const databasesNegative = [];

export const methods: {
    desc: string, method: (db: TestDatabaseType) =>
        (id: number) => Promise<NonNullable<Unpacked<ReturnType<ReturnType<typeof db.friends.populate>['get']>>>>
}[] = [
        {
            desc: 'Table.populate().get()',
            method: db => id => db.friends.populate().get(id).then(x => x!)
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
    return new Array(count).fill(null).map(() => new Friend(friend()));
};
