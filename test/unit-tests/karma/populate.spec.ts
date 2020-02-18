// tslint:disable: no-non-null-assertion
import Dexie from 'dexie';
import { cloneDeep } from 'lodash-es';
import { Populated } from '../../../src/populate.class';
import { Club, databasesPositive, Friend, methods, Methods, mockClubs, mockFriends } from '../../mocks/mocks';

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
            describe('Methods', () => {
                methods.forEach((_method, _j) => {
                    // if (_j !== 2) { return; }
                    let method: Methods;
                    let friend: Friend;
                    let friendPop: Populated<Friend>;
                    let id: number;
                    let updateId: number;

                    let hasFriends: Friend[];
                    let hasFriendIds: number[];

                    let clubs: Club[];
                    let clubIds: number[];

                    describe(_method.desc, () => {
                        beforeEach(async () => {
                            method = _method.method;
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

                            friendPop = cloneDeep(friend) as Populated<Friend>;
                            friendPop.hasFriends = hasFriends;
                            friendPop.memberOf = clubs;
                        });
                        describe('Populated', () => {
                            it('should be populated with friends', async () => {
                                const getFriend = await db.friends.populate()[method](id);
                                const expected = new Friend(getFriend as any);
                                expected.hasFriends = hasFriends as any;
                                expect(getFriend).toEqual(expected as any);
                                expect(getFriend!.hasFriends.every((x: any) => x instanceof Friend)).toBeTrue();
                            });
                            it('should be populated with clubs', async () => {
                                const getFriend = await db.friends.populate()[method](id);
                                const expected = new Friend(getFriend as any);
                                expected.memberOf = clubs as any;
                                expect(getFriend).toEqual(expected as any);
                                expect(getFriend!.memberOf.every((x: any) => x instanceof Club)).toBeTrue();
                            });
                            describe('ThenSchortcut', () => {
                                if (_method.hasCb) {
                                    it('should return the correct value', async () => {
                                        const testCb = await db.friends.populate()[method](1, value => value!);
                                        expect(testCb).toEqual(friendPop);
                                    });
                                    it('should return the changed value', async () => {
                                        const testCb = await db.friends.populate()[method](1, () => 'string');
                                        expect(testCb).toBe('string');

                                        const testCb2 = await db.friends.populate()[method](1, value => {
                                            value!.firstName = 'testieTest';
                                            return value;
                                        });
                                        expect({ ...testCb2 }).toEqual({ ...friendPop, firstName: 'testieTest' });
                                    });
                                }
                            });
                        });
                        describe('Normal', () => {
                            it('should not be populated with friends', async () => {
                                const getFriend = await db.friends[method](id);
                                const expected = new Friend(getFriend as any);
                                expected.hasFriends = hasFriendIds;
                                expect(getFriend).toEqual(expected as any);
                                expect(getFriend!.hasFriends.every((x: any) => !isNaN(x))).toBeTrue();
                            });
                            it('should not be populated with clubs', async () => {
                                const getFriend = await db.friends[method](id);
                                const expected = new Friend(getFriend as any);
                                expected.memberOf = clubIds;
                                expect(getFriend).toEqual(expected as any);
                                expect(getFriend!.hasFriends.every((x: any) => !isNaN(x))).toBeTrue();
                            });
                        });
                    });
                });
            });
        });
    });
    // databasesNegative.forEach(database => {
    // describe(database.desc, () => {
    //     let db: ReturnType<typeof database.db>;
    //     beforeEach(async () => {
    //         db = database.db(Dexie);
    //     });
    //     afterEach(async () => {
    //         await db.delete();
    //     });
    //     it('should throw when compound / multi index is used', async () => {
    //         await expectAsync(db.open()).toBeRejectedWithError(
    //              'Compound or multi indices are not (yet) supported in combination with Dexie RxJs Addon'
    //         );
    //         expect(db.isOpen()).toBeFalse();
    //     });
    // });
    // });
});

// ========== Helper functions ===========
// function flatPromise() {

//     let resolve!: () => void;
//     let reject!: () => void;

//     const promise = new Promise((res, rej) => {
//         resolve = res;
//         reject = rej;
//     });

//     return { promise, resolve, reject };
// }
