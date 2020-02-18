// tslint:disable: no-non-null-assertion
import Dexie from 'dexie';
import faker from 'faker/locale/nl';
import { populate, Ref } from '../../src/populate';

export class Club {
    id?: number;
    name: string;
    description: string;

    doSomething() {
        return 'done';
    }

    constructor(club: OmitMethods<Club>) {
        Object.entries(club).forEach(([key, value]) => {
            this[key] = value;
        });
    }

}

export class Friend {
    id?: number;
    testProp?: string;
    age: number;
    hasAge?: boolean;
    firstName: string;
    memberOf: Ref<Club[], number[]>;
    lastName: string;
    shoeSize: number;
    customId: number;
    some?: { id: number; };
    hasFriends: Ref<Friend[], number[]>;

    doSomething() {
        return 'done';
    }

    constructor(friend: OmitMethods<Friend>) {
        Object.entries(friend).forEach(([key, value]) => {
            this[key] = value;
        });
    }
}

export const databasesPositive = [
    {
        desc: 'TestDatabase',
        db: (dexie: typeof Dexie) => new class TestDatabase extends dexie {

            public friends: Dexie.Table<Friend, number>;
            public clubs: Dexie.Table<Club, number>;

            constructor(name: string) {
                super(name);
                populate(this);
                this.on('blocked', () => false);
                this.version(1).stores({
                    friends: '++id, customId, firstName, lastName, shoeSize, age, hasFriends => friends.id, memberOf => clubs.id',
                    clubs: '++id, name'
                });

                this.friends.mapToClass(Friend);
                this.clubs.mapToClass(Club);
            }
        }('TestDatabase')
    }
];

export const databasesNegative = [];

export type Methods = 'get';
export const methods: {
    desc: string;
    hasCb: boolean;
    method: Methods;
}[] = [
    {
        desc: 'Table.get()',
        hasCb: true,
        method: 'get'
    }
];

export const mockFriends = (count: number = 5): Friend[] => {
    const friend = () => new Friend({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        age: faker.random.number({ min: 1, max: 80 }),
        shoeSize: faker.random.number({ min: 5, max: 12 }),
        customId: faker.random.number({ min: 1000000, max: 9999999 }),
        hasFriends: [],
        memberOf: []
    });
    return new Array(count).fill(null).map(() => friend());
};

export const mockClubs = (count: number = 5): Club[] => {
    const club = () => new Club({
        name: faker.lorem.words(2),
        description: faker.lorem.sentences(4)
    });
    return new Array(count).fill(null).map(() => club());
};
