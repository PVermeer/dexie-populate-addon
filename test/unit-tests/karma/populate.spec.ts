// tslint:disable: no-non-null-assertion
import Dexie from 'dexie';
import { databasesPositive, Friend, methods, mockFriends } from '../../mocks/mocks';

describe('Populate', () => {
    databasesPositive.forEach((database, _i) => {
        // if (_i !== 4) { return; }
        fdescribe(database.desc, () => {
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
                    let friend: Friend;
                    let hasFriend: Friend;
                    let id: number;
                    let hasFriendId: number;
                    let updateId: number;
                    let method: ReturnType<typeof _method.method>;

                    const addFriend = (friendToAdd: Friend) => db.friends.add(friendToAdd)
                        .then(newId => {
                            switch (database.desc) {
                                case 'TestDatabaseNoKey': return _method.desc === 'Table.$' ? friendToAdd.customId : newId;
                                default: return newId;
                            }
                        });

                    describe(_method.desc, () => {
                        beforeEach(async () => {
                            [friend, hasFriend] = mockFriends(2);
                            id = await addFriend(friend);
                            hasFriendId = await addFriend(hasFriend);
                            updateId = database.desc !== 'TestDatabaseCustomKey' && id > 1000000 ? 1 : id;
                            await db.friends.update(updateId, { hasFriends: [hasFriendId] });
                            friend.hasFriends = [hasFriendId];
                            method = _method.method(db);
                        });
                        it('should be populated', async () => {
                            const friendTest = mockFriends(1)[0];
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
                            const test2 = await db.friends.get(1).then(x => x!);
                            test2.hasFriends[0] = 1;
                            test2.hasFriends = [4];
                            const getFriend = await method(id);
                            console.log(getFriend);
                            // expect(getFriend).toEqual(new Friend({
                            //     ...getFriend, hasFriends: [hasFriend as unknown as number]
                            // }));
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
