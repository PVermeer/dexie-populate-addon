// tslint:disable: no-non-null-assertion
import Dexie from 'dexie';
import { Club, databasesPositive, Friend, mockClubs, mockFriends, originalMethods, populatedMethods } from '../../mocks/mocks';

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
            it('should not have type errors', async () => {
                // Just some type matching, should not error in IDE or compilation
                const friends = mockFriends(2);
                const [friendTest] = mockFriends(1);
                const [friend] = friends;
                const clubs = mockClubs(2);
                const [clubTest] = mockClubs(1);
                const [club] = clubs;
                const friendIds = await Promise.all(friends.map(x => db.friends.add(x)));
                const clubIds = await Promise.all(clubs.map(x => db.clubs.add(x)));
                await db.friends.update(friendIds[0], {
                    hasFriends: [friendIds[1]],
                    memberOf: [clubIds[1]]
                });
                const test = await db.friends.populate().get(1).then(x => x!);
                test.doSomething();
                test.age = 4;
                test.firstName = 'sdfsdf';

                const hasFriends = test!.hasFriends!;
                hasFriends[0].id = 56;
                test.hasFriends.push(friendTest!);
                test.hasFriends = [friend];
                test.hasFriends[0] = friend;
                test.hasFriends[0].age = 8;

                const memberOf = test!.memberOf!;
                memberOf[0].id = 47;
                test.memberOf.push(clubTest!);
                test.memberOf = [club];
                test.memberOf[0] = club;
                test.memberOf[0].description = 'sdfsdfsdf';

                const test2 = await db.friends.get(1).then(x => x);
                test2!.hasFriends[0] = 1;
                expect(true).toBeTrue();
            });
            describe('Methods', () => {
                [...populatedMethods, ...originalMethods].forEach((_method, _j) => {
                    // if (_j !== 2) { return; }
                    let methodPop: ReturnType<typeof _method.method>;
                    let friend: Friend;
                    let id: number;
                    let updateId: number;

                    let hasFriends: Friend[];
                    let hasFriendIds: number[];

                    let clubs: Club[];
                    let clubIds: number[];

                    describe(_method.desc, () => {
                        beforeEach(async () => {
                            methodPop = _method.method(db);
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
                        switch (_method.populated) {
                            case true: {
                                it('should be populated with friends', async () => {
                                    const getFriend = await methodPop(id);
                                    const expected = new Friend(getFriend as any);
                                    expected.hasFriends = hasFriends as any;
                                    expect(getFriend).toEqual(expected as any);
                                    expect(getFriend.hasFriends.every((x: any) => x instanceof Friend)).toBeTrue();
                                });
                                it('should be populated with clubs', async () => {
                                    const getFriend = await methodPop(id);
                                    const expected = new Friend(getFriend as any);
                                    expected.memberOf = clubs as any;
                                    expect(getFriend).toEqual(expected as any);
                                    expect(getFriend.memberOf.every((x: any) => x instanceof Club)).toBeTrue();
                                });
                                break;
                            }
                            case false: {
                                it('should not be populated with friends', async () => {
                                    const getFriend = await methodPop(id);
                                    const expected = new Friend(getFriend as any);
                                    expected.hasFriends = hasFriendIds;
                                    expect(getFriend).toEqual(expected as any);
                                    expect(getFriend.hasFriends.every((x: any) => !isNaN(x))).toBeTrue();
                                });
                                it('should not be populated with clubs', async () => {
                                    const getFriend = await methodPop(id);
                                    const expected = new Friend(getFriend as any);
                                    expected.memberOf = clubIds;
                                    expect(getFriend).toEqual(expected as any);
                                    expect(getFriend.hasFriends.every((x: any) => !isNaN(x))).toBeTrue();
                                });
                                break;
                            }
                        }
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
