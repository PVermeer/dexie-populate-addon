// tslint:disable: no-non-null-assertion
import Dexie from 'dexie';
import { cloneDeep } from 'lodash-es';
import { Populated } from '../../../src/types';
import { Club, databasesPositive, Friend, Group, methodsNegative, methodsPositive, mockClubs, mockFriends, mockGroups, mockStyles, mockThemes, Style, Theme } from '../../mocks/mocks';

describe('Populate', () => {
    databasesPositive.forEach((database, _i) => {
        // if (_i !== 4) { return; }
        describe(database.desc, () => {
            let db: ReturnType<typeof database.db>;

            let friend: Friend;
            let id: number;
            let updateId: number;
            let friendPop: Populated<Friend, false, string>;

            let hasFriends: Friend[];
            let hasFriendIds: number[];

            let clubs: Club[];
            let clubIds: number[];

            let themes: Theme[];
            let themeIds: number[];

            let groups: Group[];
            let groupIds: number[];

            let styles: Style[];
            let styleIds: number[];

            beforeEach(async () => {
                db = database.db(Dexie);
                await db.open();
                expect(db.isOpen()).toBeTrue();

                [friend, ...hasFriends] = mockFriends();
                clubs = mockClubs();
                themes = mockThemes();
                groups = mockGroups();
                styles = mockStyles();

                id = await db.friends.add(friend);
                updateId = database.desc !== 'TestDatabaseCustomKey' && id > 1000000 ? 1 : id;

                hasFriendIds = await Promise.all(hasFriends.map(x => db.friends.add(x)));
                clubIds = await Promise.all(clubs.map(x => db.clubs.add(x)));
                themeIds = await Promise.all(themes.map(x => db.themes.add(x)));
                groupIds = await Promise.all(groups.map(x => db.groups.add(x)));
                styleIds = await Promise.all(styles.map(x => db.styles.add(x)));

                await db.friends.update(updateId, {
                    hasFriends: hasFriendIds,
                    memberOf: clubIds,
                    group: groupIds[1]
                });
                await db.friends.update(hasFriendIds[1], {
                    hasFriends: [hasFriendIds[2]]
                });
                await db.clubs.update(clubIds[1], {
                    theme: themeIds[1]
                });
                await db.themes.update(themeIds[1], {
                    style: styleIds[1]
                });

                friend.hasFriends = hasFriendIds;
                friend.memberOf = clubIds;

                friendPop = cloneDeep(friend) as Populated<Friend, false, string>;
                friendPop.hasFriends = hasFriends as Populated<Friend, false, string>[];
                friendPop.memberOf = clubs as Populated<Club, false, string>[];
                friendPop.memberOf[0]!.theme = themes[0] as Populated<Theme, false, string>;
            });
            afterEach(async () => {
                await db.delete();
            });
            describe('Methods', () => {
                methodsPositive.forEach((_method, _j) => {
                    // if (_j !== 0) { return; }
                    let method: ReturnType<typeof _method.method>;

                    describe(_method.desc, () => {
                        beforeEach(async () => {
                            method = _method.method(db);
                        });
                        if (_method.populated) {
                            describe('Populated', () => {
                                it('should be populated with friends', async () => {
                                    const getFriend = await method(id);
                                    expect(getFriend!.hasFriends!.every((x: any) => x instanceof Friend)).toBeTrue();
                                });
                                it('should be populated with friends deep', async () => {
                                    const getFriend = await method(id);
                                    expect(
                                        (getFriend!.hasFriends! as (Populated<Friend, false, string>)[])[1]
                                            .hasFriends![0] instanceof Friend
                                    ).toBeTrue();
                                });
                                it('should be null if not found', async () => {
                                    await db.friends.update(updateId, { hasFriends: [9999] });
                                    const getFriend = await method(id);
                                    expect(getFriend!.hasFriends![0]).toBe(null);
                                });
                                it('should be null if not found deep', async () => {
                                    await db.friends.update(hasFriendIds[0], { hasFriends: [9999] });
                                    const getFriend = await method(id);
                                    expect(
                                        (getFriend!.hasFriends! as (Populated<Friend, false, string>)[])[0]
                                            .hasFriends![0]
                                    ).toBe(null);
                                });
                                if (!_method.desc.endsWith('each()')) {
                                    it('should throw when circulair references are found', async () => {
                                        await db.friends.update(updateId, { hasFriends: [id] });
                                        await expectAsync(method(id) as Promise<any>)
                                            .toBeRejectedWithError('DEXIE POPULATE: Circular reference detected on \'hasFriends\'. \'hasFriends\' Probably contains a reference to itself.');
                                    });
                                }
                                if (!_method.populatedPartial) {
                                    it('should be populated with a group', async () => {
                                        const getFriend = await method(id);
                                        expect(getFriend!.group! instanceof Group).toBeTrue();
                                    });
                                    it('should be populated with clubs', async () => {
                                        const getFriend = await method(id);
                                        expect(getFriend!.memberOf!.every((x: any) => x instanceof Club)).toBeTrue();
                                    });
                                    it('should be populated with club => theme deep', async () => {
                                        const getFriend = await method(id);
                                        expect(
                                            (getFriend!.memberOf! as (Populated<Club, false, string>)[])[1]
                                                .theme instanceof Theme
                                        ).toBeTrue();
                                    });
                                }
                                if (_method.populatedPartial) {
                                    it('should be populated with friends', async () => {
                                        const getFriend = await method(id);
                                        expect(getFriend!.hasFriends!.every((x: any) => x instanceof Friend)).toBeTrue();
                                    });
                                    it('should be populated with clubs', async () => {
                                        const getFriend = await method(id);
                                        expect(getFriend!.memberOf!.every((x: any) => x instanceof Club)).toBeTrue();
                                    });
                                    it('should be populated with theme', async () => {
                                        const getFriend = await method(id);
                                        expect((getFriend!.memberOf![1]! as Club).theme instanceof Theme).toBeTrue();
                                    });
                                    it('should be populated with style', async () => {
                                        const getFriend = await method(id);
                                        expect(((getFriend!.memberOf![1]! as Club).theme as Theme).style instanceof Style).toBeTrue();
                                    });
                                    it('should not be populated with group', async () => {
                                        const getFriend = await method(id);
                                        expect(typeof getFriend!.group! === 'number').toBeTrue();
                                    });
                                }
                            });
                        }
                        if (!_method.populated) {
                            describe('Normal', () => {
                                it('should not be populated with friends', async () => {
                                    const getFriend = await method(id);
                                    expect(getFriend!.hasFriends!.every((x: any) => typeof x === 'number')).toBeTrue();
                                });
                                it('should not be populated with clubs', async () => {
                                    const getFriend = await method(id);
                                    expect(getFriend!.hasFriends!.every((x: any) => typeof x === 'number')).toBeTrue();
                                });
                            });
                        }
                    });
                });
            });
            describe('Methods negative', () => {
                methodsNegative.forEach((_method, _j) => {
                    // if (_j !== 7) { return; }
                    let method: ReturnType<typeof _method.method>;
                    describe(_method.desc, () => {
                        beforeEach(async () => {
                            method = _method.method(db);
                        });
                        describe('Provided populate key does not match with schema', () => {
                            it('should be rejected', async () => {
                                await expectAsync(method(id))
                                    .toBeRejectedWithError(`DEXIE POPULATE: Provided key 'sdfsdf' doesn't match with schema`);
                            });
                        });
                    });
                });
            });
            describe('ThenSchortcut', () => {
                describe('Table.populate().get', () => {
                    it('should return the correct value', async () => {
                        const testCb = await db.friends.populate().get(id, value => value!);
                        expect(testCb instanceof Friend).toBeTrue();
                    });
                    it('should return the changed value', async () => {
                        const testCb = await db.friends.populate().get(id, () => 'string');
                        expect(testCb).toBe('string');

                        const testCb2 = await db.friends.populate().get(id, value => {
                            value!.firstName = 'testieTest';
                            return value;
                        });
                        expect(testCb2!.firstName).toBe('testieTest');
                    });
                });
                describe('Table.populate().where()', () => {
                    it('should return the correct value', async () => {
                        const testCb = await db.friends.populate().where(':id').equals(id).first(value => value!);
                        expect(testCb instanceof Friend).toBeTrue();
                    });
                    it('should return the changed value', async () => {
                        const testCb = await db.friends.populate().where(':id').equals(id).first(() => 'string');
                        expect(testCb).toBe('string');

                        const testCb2 = await db.friends.populate().where(':id').equals(id).first(value => {
                            value!.firstName = 'testieTest';
                            return value;
                        });
                        expect(testCb2!.firstName).toBe('testieTest');
                    });
                });
            });
        });
    });
});
