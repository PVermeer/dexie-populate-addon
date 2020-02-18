// tslint:disable: no-non-null-assertion
import Dexie from 'dexie';
import { cloneDeep } from 'lodash-es';
import { Populated } from '../../../src/populate.class';
import { databasesPositive, Friend, mockClubs, mockFriends } from '../../mocks/mocks';

describe('Typings', () => {
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
                const friendIds = await Promise.all(friends.map(x => db.friends.add(x)));
                const clubIds = await Promise.all(clubs.map(x => db.clubs.add(x)));
                const friendPop = cloneDeep(friends[0]) as Populated<Friend>;

                await db.friends.update(friendIds[0], {
                    hasFriends: [friendIds[1]],
                    memberOf: [clubIds[1]]
                });
                friend.hasFriends = [friendIds[1]];
                friend.memberOf = [clubIds[1]];
                friendPop.hasFriends = [friends[1]];
                friendPop.memberOf = [clubs[1]];

                const test = await db.friends.populate().get(1).then(x => x!);
                expect(test).toEqual(friendPop);
                test.doSomething();
                test.age = 4;
                test.firstName = 'sdfsdf';

                const hasFriends = test!.hasFriends!;
                hasFriends[0].id = 56;
                test.hasFriends.push(friendTest!);
                test.hasFriends = [friendTest];
                test.hasFriends[0] = friendTest;
                test.hasFriends[0].age = 8;

                const memberOf = test!.memberOf!;
                memberOf[0].id = 47;
                test.memberOf.push(clubTest!);
                test.memberOf = [clubTest];
                test.memberOf[0] = clubTest;
                test.memberOf[0].description = 'sdfsdfsdf';

                const test2 = await db.friends.get(1).then(x => x);
                expect(test2).toEqual(friend);
                test2!.hasFriends[0] = 1;

                const testCb = await db.friends.get(1, value => {
                    value!.hasFriends = [2];
                    return value;
                });
                expect(testCb).toEqual(friend);

                const testCb2 = await db.friends.populate().get(1, value => {
                    value!.hasFriends = [friends[1]];
                    return value;
                });
                expect(testCb2).toEqual(friendPop);
            });
        });
    });
});
