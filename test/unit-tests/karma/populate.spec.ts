// tslint:disable: no-non-null-assertion
import Dexie from 'dexie';
import { cloneDeep } from 'lodash-es';
import { Populated } from '../../../src/populate.class';
import { Club, databasesPositive, Friend, methods, mockClubs, mockFriends } from '../../mocks/mocks';

describe('Populate', () => {
    databasesPositive.forEach((database, _i) => {
        // if (_i !== 4) { return; }
        describe(database.desc, () => {
            let db: ReturnType<typeof database.db>;
            beforeEach(async () => {
                db = database.db(Dexie);
                await db.open();
                expect(db.isOpen()).toBeTrue();
            });
            afterEach(async () => {
                await db.delete();
            });
            it('should work', async () => {
                const friends = mockFriends(2);
                const ids = await db.friends.bulkAdd(friends, { allKeys: true });
                await db.friends.update(ids[0], { hasFriends: [ids[1]] });

                const test = await db.friends.populate().where(':id').equals(1).first();

                console.log(test);
                expect(true).toBeTrue();
            });
            describe('Methods', () => {
                methods.forEach((_method, _j) => {
                    // if (_j !== 2) { return; }
                    let method: ReturnType<typeof _method.method>;
                    let friend: Friend;
                    let id: number;
                    let updateId: number;

                    let hasFriends: Friend[];
                    let hasFriendIds: number[];

                    let clubs: Club[];
                    let clubIds: number[];

                    describe(_method.desc, () => {
                        beforeEach(async () => {
                            method = _method.method(db);
                            [friend, ...hasFriends] = mockFriends();
                            clubs = mockClubs();

                            id = await db.friends.add(friend);
                            updateId = database.desc !== 'TestDatabaseCustomKey' && id > 1000000 ? 1 : id;

                            hasFriendIds = await Promise.all(hasFriends.map(x => db.friends.add(x)));
                            await db.friends.update(updateId, { hasFriends: hasFriendIds });
                            friend.hasFriends = hasFriendIds;

                            clubIds = await Promise.all(clubs.map(x => db.clubs.add(x)));
                            await db.friends.update(updateId, { memberOf: clubIds });
                            friend.memberOf = clubIds;
                        });
                        if (_method.populated) {
                            describe('Populated', () => {
                                it('should be populated with friends', async () => {
                                    const getFriend = await method(id);
                                    const expected = new Friend(getFriend as any);
                                    expected.hasFriends = hasFriends as any;
                                    expect(getFriend).toEqual(expected as any);
                                    expect(getFriend!.hasFriends.every((x: any) => x instanceof Friend)).toBeTrue();
                                });
                                it('should be populated with clubs', async () => {
                                    const getFriend = await method(id);
                                    const expected = new Friend(getFriend as any);
                                    expected.memberOf = clubs as any;
                                    expect(getFriend).toEqual(expected as any);
                                    console.log(getFriend!.memberOf.every((x: any) => x instanceof Club));
                                    expect(getFriend!.memberOf.every((x: any) => x instanceof Club)).toBeTrue();
                                });
                            });
                        }
                        if (!_method.populated) {
                            describe('Normal', () => {
                                it('should not be populated with friends', async () => {
                                    const getFriend = await method(id);
                                    const expected = new Friend(getFriend as any);
                                    expected.hasFriends = hasFriendIds;
                                    expect(getFriend).toEqual(expected as any);
                                    expect(getFriend!.hasFriends.every((x: any) => !isNaN(x))).toBeTrue();
                                });
                                it('should not be populated with clubs', async () => {
                                    const getFriend = await method(id);
                                    const expected = new Friend(getFriend as any);
                                    expected.memberOf = clubIds;
                                    expect(getFriend).toEqual(expected as any);
                                    expect(getFriend!.hasFriends.every((x: any) => !isNaN(x))).toBeTrue();
                                });
                            });
                        }
                    });
                });
            });
            describe('ThenSchortcut', () => {
                let friend: Friend;
                let hasFriend: Friend;
                let friendPop: Populated<Friend>;
                let ids: number[];
                beforeEach(async () => {
                    let friends = mockFriends(2);
                    ids = await db.friends.bulkAdd(friends, { allKeys: true });
                    await db.friends.update(ids[0], { hasFriends: [ids[1]] });
                    friends = friends.map((x, i) => { x.id = ids[i]; return x; });
                    [friend, hasFriend] = friends;
                    friendPop = cloneDeep(friend) as Populated<Friend>;
                    friendPop.hasFriends = [hasFriend];
                });
                describe('Table.populate().get', () => {
                    it('should return the correct value', async () => {
                        const testCb = await db.friends.populate().get(ids[0], value => value!);
                        expect(testCb).toEqual(friendPop);
                    });
                    it('should return the changed value', async () => {
                        const testCb = await db.friends.populate().get(ids[0], () => 'string');
                        expect(testCb).toBe('string');

                        const testCb2 = await db.friends.populate().get(ids[0], value => {
                            value!.firstName = 'testieTest';
                            return value;
                        });
                        expect({ ...testCb2 }).toEqual({ ...friendPop, firstName: 'testieTest' });
                    });
                });
                describe('Table.populate().where()', () => {
                    it('should return the correct value', async () => {
                        const testCb = await db.friends.populate().where(':id').equals(ids[0]).first(value => value!);
                        expect(testCb).toEqual(friendPop);
                    });
                    it('should return the changed value', async () => {
                        const testCb = await db.friends.populate().where(':id').equals(ids[0]).first(() => 'string');
                        expect(testCb).toBe('string');

                        const testCb2 = await db.friends.populate().where(':id').equals(ids[0]).first(value => {
                            value!.firstName = 'testieTest';
                            return value;
                        });
                        expect({ ...testCb2 }).toEqual({ ...friendPop, firstName: 'testieTest' });
                    });
                });
            });
        });
    });
});
