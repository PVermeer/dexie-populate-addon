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
                // Just some type matching, should not error in IDE / compilation or test
                const friends = mockFriends(2);
                const [friendTest] = mockFriends(1);
                const [friend] = friends;
                const clubs = mockClubs(2);
                const [clubTest] = mockClubs(1);
                const friendIds = await Promise.all(friends.map(x => db.friends.add(x)));
                const clubIds = await Promise.all(clubs.map(x => db.clubs.add(x)));
                const friendPop = cloneDeep(friends[0]) as Populated<Friend, true>;

                await db.friends.update(friendIds[0], {
                    hasFriends: [friendIds[1]],
                    memberOf: [clubIds[1]]
                });
                friend.hasFriends = [friendIds[1]];
                friend.memberOf = [clubIds[1]];
                friendPop.hasFriends = [friends[1]];
                friendPop.memberOf = [clubs[1]];

                const populatedShallow = await Promise.all([
                    db.friends.populate({ shallow: true }).get(1).then(x => x!),
                    db.friends.populate({ shallow: true }).where(':id').equals(1).first().then(x => x!)
                ]);
                populatedShallow.forEach(async test => {

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
                });
                const populatedDeep = await Promise.all([
                    db.friends.populate().get(1).then(x => x!),
                    db.friends.populate().where(':id').equals(1).first().then(x => x!)
                ]);
                populatedDeep.forEach(async test => {

                    test.doSomething();
                    test.age = 4;
                    test.firstName = 'sdfsdf';

                    test.hasFriends[0].id = 56;
                    test.hasFriends[0].age = 8;
                    test.hasFriends[0].hasFriends[0].age = 1;

                    test.memberOf[0].id = 47;
                    test.memberOf[0].description = 'sdfsdfsdf';
                    test.memberOf[0].theme.name = 'sdfsdfsdf';
                });

                const notPopulated = await Promise.all([
                    db.friends.get(1).then(x => x!),
                    db.friends.where(':id').equals(1).first().then(x => x!)
                ]);
                notPopulated.forEach(async test => {
                    test!.hasFriends![0] = 1;
                });


                // ===== Callbacks (thenSchortcuts) =====

                const testCbGet = await db.friends.get(1, value => {
                    value!.hasFriends = [2];
                    return value;
                });
                expect(testCbGet).toEqual(friend);

                const testCb2Get = await db.friends.populate({ shallow: true }).get(1, value => {
                    value!.hasFriends = [friends[1]];
                    return value;
                });
                expect(testCb2Get).toEqual(friendPop);

                const testCbWhere = await db.friends.where(':id').equals(1).first(value => {
                    value!.hasFriends = [2];
                    return value;
                });
                expect(testCbWhere).toEqual(friend);

                const testCbWhere2 = await db.friends.populate({ shallow: true }).where(':id').equals(1).first(value => {
                    value!.hasFriends = [friends[1]];
                    return value;
                });
                expect(testCbWhere2).toEqual(friendPop);


                // ===== Each (thenSchortcuts) =====

                const testEach = await new Promise((res: (value: Friend) => void) =>
                    db.friends.each(x => res(x)));
                expect(testEach).toEqual(friend);

                const testEach2 = await new Promise((res: (value: Populated<Friend, true>) => void) =>
                    db.friends.populate({ shallow: true }).each(x => res(x)));
                expect(testEach2).toEqual(friendPop);

                const testEachWhere = await new Promise((res: (value: Friend) => void) =>
                    db.friends.where(':id').equals(1).each(x => res(x)));
                expect(testEachWhere).toEqual(friend);

                const testEachWhere2 = await new Promise((res: (value: Populated<Friend, true>) => void) =>
                    db.friends.populate({ shallow: true }).where(':id').equals(1).each(x => res(x)));
                expect(testEachWhere2).toEqual(friendPop);
            });
        });
    });
});
