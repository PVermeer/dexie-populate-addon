// tslint:disable: no-non-null-assertion
import Dexie from 'dexie';
import { cloneDeep } from 'lodash-es';
import { Populated } from '../../../src/populate.class';
import { Club, databasesPositive, Friend, methodsPositive, mockClubs, mockFriends, methodsNegative } from '../../mocks/mocks';

describe('Populate', () => {
    databasesPositive.forEach((database, _i) => {
        // if (_i !== 4) { return; }
        describe(database.desc, () => {
            let db: ReturnType<typeof database.db>;

            let friend: Friend;
            let id: number;
            let updateId: number;
            let friendPop: Populated<Friend>;

            let hasFriends: Friend[];
            let hasFriendIds: number[];

            let clubs: Club[];
            let clubIds: number[];

            beforeEach(async () => {
                db = database.db(Dexie);
                await db.open();
                expect(db.isOpen()).toBeTrue();

                [friend, ...hasFriends] = mockFriends();
                clubs = mockClubs();

                id = await db.friends.add(friend);
                updateId = database.desc !== 'TestDatabaseCustomKey' && id > 1000000 ? 1 : id;

                hasFriendIds = await Promise.all(hasFriends.map(x => db.friends.add(x)));
                await db.friends.update(updateId, { hasFriends: hasFriendIds });
                friend.hasFriends = hasFriendIds;

                friendPop = cloneDeep(friend) as Populated<Friend>;
                friendPop.hasFriends = hasFriends;
                friendPop.memberOf = clubs;

                clubIds = await Promise.all(clubs.map(x => db.clubs.add(x)));
                await db.friends.update(updateId, { memberOf: clubIds });
                friend.memberOf = clubIds;
            });
            afterEach(async () => {
                await db.delete();
            });
            describe('Methods', () => {
                methodsPositive.forEach((_method, _j) => {
                    // if (_j !== 7) { return; }
                    let method: ReturnType<typeof _method.method>;

                    describe(_method.desc, () => {
                        beforeEach(async () => {
                            method = _method.method(db);
                        });
                        if (_method.populated) {
                            describe('Populated', () => {
                                it('should be populated with friends', async () => {
                                    const getFriend = await method(id);
                                    const expected = new Friend(getFriend as any);
                                    expected.hasFriends = hasFriends as any;
                                    expect(getFriend).toEqual(expected as any);
                                    expect(getFriend!.hasFriends!.every((x: any) => x instanceof Friend)).toBeTrue();
                                });
                                if (!_method.populatedPartial) {
                                    it('should be populated with clubs', async () => {
                                        const getFriend = await method(id);
                                        const expected = new Friend(getFriend as any);
                                        expected.memberOf = clubs as any;
                                        expect(getFriend).toEqual(expected as any);
                                        expect(getFriend!.hasFriends!.every((x: any) => x instanceof Friend)).toBeTrue();
                                        expect(getFriend!.memberOf!.every((x: any) => x instanceof Club)).toBeTrue();
                                    });
                                } else {
                                    it('should not be populated with clubs', async () => {
                                        const getFriend = await method(id);
                                        const expected = new Friend(getFriend as any);
                                        expect(getFriend).toEqual(expected as any);
                                        expect(getFriend!.hasFriends!.every((x: any) => x instanceof Friend)).toBeTrue();
                                        expect(getFriend!.memberOf!.every((x: any) => typeof x === 'number')).toBeTrue();
                                    });
                                }
                            });
                        }
                        if (!_method.populated) {
                            describe('Normal', () => {
                                it('should not be populated with friends', async () => {
                                    const getFriend = await method(id);
                                    const expected = new Friend(getFriend as any);
                                    expected.hasFriends = hasFriendIds;
                                    expect(getFriend).toEqual(expected as any);
                                    expect(getFriend!.hasFriends!.every((x: any) => !isNaN(x))).toBeTrue();
                                });
                                it('should not be populated with clubs', async () => {
                                    const getFriend = await method(id);
                                    const expected = new Friend(getFriend as any);
                                    expected.memberOf = clubIds;
                                    expect(getFriend).toEqual(expected as any);
                                    expect(getFriend!.hasFriends!.every((x: any) => !isNaN(x))).toBeTrue();
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
                        expect(testCb).toEqual(friendPop);
                    });
                    it('should return the changed value', async () => {
                        const testCb = await db.friends.populate().get(id, () => 'string');
                        expect(testCb).toBe('string');

                        const testCb2 = await db.friends.populate().get(id, value => {
                            value!.firstName = 'testieTest';
                            return value;
                        });
                        expect({ ...testCb2 }).toEqual({ ...friendPop, firstName: 'testieTest' });
                    });
                });
                describe('Table.populate().where()', () => {
                    it('should return the correct value', async () => {
                        const testCb = await db.friends.populate().where(':id').equals(id).first(value => value!);
                        expect(testCb).toEqual(friendPop);
                    });
                    it('should return the changed value', async () => {
                        const testCb = await db.friends.populate().where(':id').equals(id).first(() => 'string');
                        expect(testCb).toBe('string');

                        const testCb2 = await db.friends.populate().where(':id').equals(id).first(value => {
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
