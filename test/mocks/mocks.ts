// tslint:disable: no-non-null-assertion
import Dexie, { PromiseExtended } from 'dexie';
import faker from 'faker/locale/nl';
import { populate, Ref } from '../../src/populate';
import { Populated } from '../../src/populate.class';

export class Theme {
    id?: number;
    name: string;
    style: string;
    description: string;

    doSomething() {
        return 'done';
    }

    constructor(theme: OmitMethods<Theme>) {
        Object.entries(theme).forEach(([key, value]) => {
            this[key] = value;
        });
    }

}
export class Club {
    id?: number;
    name: string;
    size: number;
    theme: Ref<Theme, number>;
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
            public themes: Dexie.Table<Theme, number>;

            constructor(name: string) {
                super(name);
                populate(this);
                this.on('blocked', () => false);
                this.version(1).stores({
                    friends: '++id, customId, firstName, lastName, shoeSize, age, hasFriends => friends.id, memberOf => clubs.id',
                    clubs: '++id, name, theme => themes.id',
                    themes: '++id, name'
                });

                this.friends.mapToClass(Friend);
                this.clubs.mapToClass(Club);
                this.themes.mapToClass(Theme);
            }
        }('TestDatabase')
    }
];

export const databasesNegative = [];

type TestDatabaseType = Dexie & { friends: Dexie.Table<Friend, number> };

export const methodsPositive = [
    {
        desc: 'Table.populate().get()',
        populated: true,
        method: (db: TestDatabaseType) => (id: number) => db.friends.populate().get(id).then(x => x!)
    },
    {
        desc: `Table.populate(['hasFriends']).get()`,
        populated: true,
        populatedPartial: true,
        method: (db: TestDatabaseType) => (id: number) => db.friends.populate(['hasFriends']).get(id).then(x => x!)
    },
    {
        desc: 'Table.get()',
        populated: false,
        method: (db: TestDatabaseType) => (id: number) => db.friends.get(id).then(x => x!)
    },
    {
        desc: 'Table.populate().where()',
        populated: true,
        method: (db: TestDatabaseType) => (id: number) => db.friends.populate().where(':id').equals(id).first()
    },
    {
        desc: `Table.populate(['hasFriends']).where()`,
        populated: true,
        populatedPartial: true,
        method: (db: TestDatabaseType) => (id: number) => db.friends.populate(['hasFriends']).where(':id').equals(id).first()
    },
    {
        desc: 'Table.where()',
        populated: false,
        method: (db: TestDatabaseType) => (id: number) => db.friends.where(':id').equals(id).first()
    },
    {
        desc: 'Table.populate().each()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number) =>
            new Promise((res: (value: Populated<Friend, false>) => void) =>
                db.friends.populate().each(x => res(x)))
    },
    {
        desc: `Table.populate(['hasFriends']).each()`,
        populated: true,
        populatedPartial: true,
        method: (db: TestDatabaseType) => (_id: number) =>
            new Promise((res: (value: Populated<Friend, false>) => void) =>
                db.friends.populate(['hasFriends']).each(x => res(x)))
    },
    {
        desc: 'Table.each()',
        populated: false,
        method: (db: TestDatabaseType) => (_id: number) =>
            new Promise((res: (value: Friend) => void) =>
                db.friends.each(x => res(x)))
    },
    {
        desc: 'Table.populate().where().each()',
        populated: true,
        method: (db: TestDatabaseType) => (id: number) =>
            new Promise((res: (value: Populated<Friend, false>) => void) =>
                db.friends.populate().where(':id').equals(id).each(x => res(x)))
    },
    {
        desc: `Table.populate(['hasFriends']).where().each()`,
        populated: true,
        populatedPartial: true,
        method: (db: TestDatabaseType) => (id: number) =>
            new Promise((res: (value: Populated<Friend, false>) => void) =>
                db.friends.populate(['hasFriends']).where(':id').equals(id).each(x => res(x)))
    },
    {
        desc: 'Table.where().each()',
        populated: false,
        method: (db: TestDatabaseType) => (id: number) =>
            new Promise((res: (value: Friend) => void) =>
                db.friends.where(':id').equals(id).each(x => res(x)))
    }
];

export const methodsNegative = [
    {
        desc: 'Table.populate().get()',
        populated: true,
        method: (db: TestDatabaseType) => (id: number) => db.friends.populate(['sdfsdf']).get(id).then(x => x!)
    },
    {
        desc: 'Table.populate().where()',
        populated: true,
        method: (db: TestDatabaseType) => (id: number) => db.friends.populate(['sdfsdf']).where(':id').equals(id).first()
    },
    {
        desc: 'Table.populate().each()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number) =>
            db.friends.populate(['sdfsdf'])
                .each(x => x) as unknown as PromiseExtended<Populated<Friend, false>>
    },
    {
        desc: 'Table.populate().where().each()',
        populated: true,
        method: (db: TestDatabaseType) => (id: number) =>
            db.friends.populate(['sdfsdf']).where(':id').equals(id)
                .each(x => x) as unknown as PromiseExtended<Populated<Friend, false>>
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
        size: faker.random.number(),
        theme: null,
        description: faker.lorem.sentences(4)
    });
    return new Array(count).fill(null).map(() => club());
};

export const mockThemes = (count: number = 5): Theme[] => {
    const theme = () => new Theme({
        name: faker.lorem.words(2),
        style: faker.random.word(),
        description: faker.lorem.sentences(4)
    });
    return new Array(count).fill(null).map(() => theme());
};
