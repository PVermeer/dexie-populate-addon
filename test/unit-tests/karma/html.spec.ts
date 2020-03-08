// tslint:disable: no-non-null-assertion
import DexieType from 'dexie';
import { populate } from '../../../src/index';
import { Friend, methodsPositive, mockFriends } from '../../mocks/mocks';

declare interface DexiePopulateAddon { populate: typeof populate; }
declare const Dexie: typeof DexieType;
declare const DexiePopulateAddon: DexiePopulateAddon;

type HTMLDb = DexieType & { friends: DexieType.Table<OmitMethods<Friend>, number> };

describe('HTML script tag', () => {
    beforeAll(async () => {
        await Promise.all([
            await new Promise(resolve => {
                const script = document.createElement('script');
                console.warn('Still using dexie@next HTML import !!!!!!!!!!!!!!!!!!!!!!!!');
                script.src = 'https://unpkg.com/dexie@next/dist/dexie.js';
                script.type = 'text/javascript';
                script.onload = () => resolve();
                document.head.append(script);
            })
        ]);
        await new Promise(resolve => {
            const script = document.createElement('script');
            script.src = `/base/dist/dexie-populate-addon.min.js`;
            script.type = 'text/javascript';
            script.onload = () => resolve();
            document.head.append(script);
        });
    });
    it('should load Dexie.js', () => {
        expect(Dexie).toBeTruthy();
    });
    it('should load the addon', () => {
        expect(DexiePopulateAddon).toBeTruthy();
        expect(DexiePopulateAddon.populate).toBeTruthy();
    });
    describe('Database HTML', () => {
        let db: HTMLDb;
        beforeEach(async () => {
            db = new Dexie('TestDatabaseHTML', {
                addons: [DexiePopulateAddon.populate]
            }) as HTMLDb;
            db.version(1).stores({
                friends: '++id, customId, firstName, lastName, shoeSize, age, hasFriends => friends.id, memberOf => clubs.id, group => groups.id, hairColor => hairColors.id',
                clubs: '++id, name, theme => themes.id',
                themes: '++id, name, style => styles.id',
                styles: '++id, name, color',
                groups: '++id, name',
                hairColors: '++id, name'
            });
            await db.open();
            expect(db.isOpen()).toBeTrue();
        });
        afterEach(async () => {
            await db.delete();
        });
        it('should be able to use normally', async () => {
            const [friend] = mockFriends(1);
            const id = await db.friends.add(friend);
            const getFriend = await db.friends.get(id);
            expect({ ...getFriend }).toEqual({ ...friend });
        });
        describe('Methods', () => {
            methodsPositive.forEach((_method, _j) => {
                // if (_j !== 0) { return; }
                let hasFriends: OmitMethods<Friend>[];
                let friend: OmitMethods<Friend>;
                let id: number;
                let hasFriendsIds: number[];
                let method: ReturnType<typeof _method.method>;

                describe(_method.desc, () => {
                    beforeEach(async () => {
                        const friends = mockFriends();
                        [friend, ...hasFriends] = friends;
                        friend = { ...friend };
                        id = await db.friends.add(friend);
                        hasFriendsIds = await db.friends.bulkAdd(hasFriends, { allKeys: true });
                        hasFriends = hasFriends.map((x, i) => ({ ...x, id: hasFriendsIds[i] }));
                        db.friends.update(id, {
                            hasFriends: hasFriendsIds
                        });
                        method = _method.method(db as any);
                    });
                    if (_method.populated) {
                        it('should be able to use populate()', async () => {
                            const getFriend = await method(id);
                            const expected = { ...friend, hasFriends };
                            expect(getFriend).toEqual(expected as any);
                        });
                    }
                });
            });
        });
    });
});
