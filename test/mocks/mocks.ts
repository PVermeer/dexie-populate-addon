// tslint:disable: no-non-null-assertion
import Dexie, { PromiseExtended } from 'dexie';
import faker from 'faker/locale/nl';
import { populate } from '../../src/populate';
import { Populated, Ref } from '../../src/types';

export class Style {
    id?: number;
    name: string;
    color: string;
    description: string;

    doSomething() {
        return 'done';
    }

    constructor(style: OmitMethods<Style>) {
        Object.entries(style).forEach(([key, value]) => {
            this[key] = value;
        });
    }

}
export class Theme {
    id?: number;
    name: string;
    style: Ref<Style, number>;
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
export class Group {
    id?: number;
    name: string;
    true: boolean;
    description: string;

    doSomething() {
        return 'done';
    }

    constructor(group: OmitMethods<Group>) {
        Object.entries(group).forEach(([key, value]) => {
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
    lastName: string;
    shoeSize: number;
    customId: number;
    some?: { id: number; other: string };
    hasFriends: Ref<Friend[], number[]>;
    memberOf: Ref<Club[], number[]>;
    group: Ref<Group, number>;

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
            public groups: Dexie.Table<Group, number>;
            public styles: Dexie.Table<Style, number>;

            constructor(name: string) {
                super(name);
                populate(this);
                this.on('blocked', () => false);
                this.version(1).stores({
                    friends: '++id, customId, firstName, lastName, shoeSize, age, hasFriends => friends.id, memberOf => clubs.id, group => groups.id',
                    clubs: '++id, name, theme => themes.id',
                    themes: '++id, name, style => styles.id',
                    styles: '++id, name, color',
                    groups: '++id, name'
                });

                this.friends.mapToClass(Friend);
                this.clubs.mapToClass(Club);
                this.themes.mapToClass(Theme);
                this.groups.mapToClass(Group);
                this.styles.mapToClass(Style);
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
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).get(_id).then(x => x!)
    },
    {
        desc: `Table.populate(['hasFriends', 'memberOf', 'theme', 'style']).get()`,
        populated: true,
        populatedPartial: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate(['hasFriends', 'memberOf', 'theme', 'style']).get(_id).then(x => x!)
    },
    {
        desc: 'Table.get()',
        populated: false,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.get(_id).then(x => x!)
    },
    {
        desc: 'Table.populate().where()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).where(':id').equals(_id).first()
    },
    {
        desc: `Table.populate(['hasFriends', 'memberOf', 'theme', 'style']).where()`,
        populated: true,
        populatedPartial: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate(['hasFriends', 'memberOf', 'theme', 'style']).where(':id').equals(_id).first()
    },
    {
        desc: 'Table.where()',
        populated: false,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.where(':id').equals(_id).first()
    },
    {
        desc: 'Table.populate().each()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            new Promise((res: (value: Populated<Friend, false>) => void) =>
                db.friends.populate({ shallow: _shallow }).each(x => res(x)))
    },
    {
        desc: `Table.populate(['hasFriends', 'memberOf', 'theme', 'style']).each()`,
        populated: true,
        populatedPartial: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            new Promise((res: (value: Populated<Friend, false>) => void) =>
                db.friends.populate(['hasFriends', 'memberOf', 'theme', 'style']).each(x => res(x)))
    },
    {
        desc: 'Table.each()',
        populated: false,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            new Promise((res: (value: Friend) => void) =>
                db.friends.each(x => res(x)))
    },
    {
        desc: 'Table.populate().where().each()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            new Promise((res: (value: Populated<Friend, false>) => void) =>
                db.friends.populate({ shallow: _shallow }).where(':id').equals(_id).each(x => res(x)))
    },
    {
        desc: `Table.populate(['hasFriends', 'memberOf', 'theme', 'style']).where().each()`,
        populated: true,
        populatedPartial: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            new Promise((res: (value: Populated<Friend, false>) => void) =>
                db.friends.populate(['hasFriends', 'memberOf', 'theme', 'style']).where(':id').equals(_id).each(x => res(x)))
    },
    {
        desc: 'Table.where().each()',
        populated: false,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            new Promise((res: (value: Friend) => void) =>
                db.friends.where(':id').equals(_id).each(x => res(x)))
    }
];

export const methodsNegative = [
    {
        desc: 'Table.populate().get()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate(['sdfsdf']).get(_id).then(x => x!)
    },
    {
        desc: 'Table.populate().where()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate(['sdfsdf']).where(':id').equals(_id).first()
    },
    {
        desc: 'Table.populate().each()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate(['sdfsdf'])
                .each(x => x) as unknown as PromiseExtended<Populated<Friend, false>>
    },
    {
        desc: 'Table.populate().where().each()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate(['sdfsdf']).where(':id').equals(_id)
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
        memberOf: [],
        group: null
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
        style: null,
        description: faker.lorem.sentences(4)
    });
    return new Array(count).fill(null).map(() => theme());
};
export const mockGroups = (count: number = 5): Group[] => {
    const group = () => new Group({
        name: faker.lorem.words(2),
        true: faker.random.boolean(),
        description: faker.lorem.sentences(4)
    });
    return new Array(count).fill(null).map(() => group());
};
export const mockStyles = (count: number = 5): Style[] => {
    const style = () => new Style({
        name: faker.lorem.words(2),
        color: faker.random.word(),
        description: faker.lorem.sentences(4)
    });
    return new Array(count).fill(null).map(() => style());
};
