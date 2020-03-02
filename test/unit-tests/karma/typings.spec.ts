// tslint:disable: no-non-null-assertion
import Dexie from 'dexie';
import { cloneDeep } from 'lodash-es';
import { Populated } from '../../../src/types';
import { databasesPositive, Friend, mockClubs, mockFriends, mockGroups, mockStyles, mockThemes } from '../../mocks/mocks';

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
                const [friend] = mockFriends(1);
                const friendId = await db.friends.add(friend);
                const friends = mockFriends();
                const [friendTest] = mockFriends(1);
                const clubs = mockClubs();
                const [clubTest] = mockClubs(1);
                const groups = mockGroups();
                const [groupTest] = mockGroups(1);
                const themes = mockThemes();
                const styles = mockStyles();
                const friendIds = await Promise.all(friends.map(x => db.friends.add(x)));
                const clubIds = await Promise.all(clubs.map(x => db.clubs.add(x)));
                const groupIds = await Promise.all(groups.map(x => db.groups.add(x)));
                const themeIds = await Promise.all(themes.map(x => db.themes.add(x)));
                const styleIds = await Promise.all(styles.map(x => db.styles.add(x)));
                const friendPop = cloneDeep(friend) as Populated<Friend, true>;

                await db.friends.update(friendId, {
                    hasFriends: friendIds,
                    memberOf: clubIds,
                    group: groupIds[1]
                });
                await db.friends.update(friendIds[1], {
                    hasFriends: [friendIds[2]]
                });
                await db.clubs.update(clubIds[1], {
                    theme: themeIds[1]
                });
                await db.themes.update(themeIds[1], {
                    style: styleIds[1]
                });
                friend.hasFriends = friendIds;
                friend.memberOf = clubIds;
                friend.group = groupIds[1];

                friendPop.hasFriends = friends;
                friendPop.memberOf = clubs;
                friendPop.group = groups[1];

                const populatedShallow = await Promise.all([
                    db.friends.populate({ shallow: true }).get(1).then(x => x),
                    db.friends.populate({ shallow: true }).where(':id').equals(1).first().then(x => x)
                ]);
                populatedShallow.forEach(async test => {

                    if (test === undefined) { return; }

                    test.doSomething();
                    test.age = 4;
                    test.firstName = 'sdfsdf';

                    const hasFriends = test.hasFriends;
                    let hasFriend = hasFriends[0];
                    if (hasFriend === null) { return; }
                    hasFriend.doSomething();
                    test.hasFriends.push(friendTest!);
                    test.hasFriends = [friendTest];
                    hasFriend.age = 56;
                    hasFriend = friendTest;
                    hasFriend = null;

                    const memberOf = test.memberOf;
                    let club = memberOf[0];
                    if (club === null) { return; }
                    club.doSomething();
                    test.memberOf.push(clubTest!);
                    test.memberOf = [clubTest];
                    club = clubTest;
                    club.description = 'sdfsdfsdf';
                    club = null;

                    let group = test.group;
                    if (group === null) { return; }
                    group.doSomething();
                    group.description = 'sdfsdfsdf';
                    group = groupTest;
                    group = null;

                    test = undefined;
                });

                const populatedDeep = await Promise.all([
                    db.friends.populate().get(1).then(x => x),
                    db.friends.populate().where(':id').equals(1).first().then(x => x)
                ]);
                populatedDeep.forEach(async test => {

                    if (test === undefined) { return; }

                    test.doSomething();
                    test.age = 4;
                    test.firstName = 'sdfsdf';

                    const hasFriends = test.hasFriends;
                    let hasFriend = hasFriends[0];
                    if (hasFriend === null) { return; }
                    hasFriend.doSomething();
                    hasFriend.age = 56;
                    hasFriend = null;

                    const hasFriendsNested = test.hasFriends[1]!.hasFriends;
                    let hasFriendNested = hasFriendsNested[0];
                    if (hasFriendNested === null) { return; }
                    hasFriendNested.doSomething();
                    hasFriendNested.age = 56;
                    hasFriendNested = null;

                    const memberOf = test.memberOf;
                    let isMemberOf = memberOf[0];
                    if (isMemberOf === null) { return; }
                    isMemberOf.doSomething();
                    isMemberOf.name = 'fsdfdf';
                    isMemberOf = null;

                    let theme = memberOf[1]!.theme;
                    if (theme === null) { return; }
                    theme.doSomething();
                    theme.name = 'fsdfdf';
                    theme = null;

                    test = undefined;
                });

                // ========= Partial populate ========

                const populatedPartial = await Promise.all([
                    db.friends.populate(['hasFriends', 'memberOf', 'theme', 'style']).get(1).then(x => x),
                ]);
                populatedPartial.forEach(async test => {

                    if (test === undefined) { return; }

                    const hasFriends = test!.hasFriends;
                    let hasFriend = hasFriends[0];
                    if (hasFriend === null) { return; }
                    hasFriend.doSomething();
                    hasFriend.age = 56;
                    hasFriend = null;

                    const memberOf = test!.memberOf;
                    let isMemberOf = memberOf![1];
                    if (isMemberOf === null) { return; }
                    isMemberOf.doSomething();
                    isMemberOf.name = 'fsdfdf';
                    isMemberOf.theme!.name = 'vsvsdv';
                    isMemberOf.theme!.style!.color = 'asdasd';
                    isMemberOf = null;

                });

                // ======= Not Populated =======

                const notPopulated = await Promise.all([
                    db.friends.get(1).then(x => x!),
                    db.friends.where(':id').equals(1).first().then(x => x!)
                ]);
                notPopulated.forEach(async test => {
                    test!.hasFriends![0] = 1;
                });

                // ===== Callbacks (thenSchortcuts) =====

                await db.friends.get(1, value => {
                    value!.hasFriends = [2];
                    return value;
                });

                await db.friends.populate({ shallow: true }).get(1, value => {
                    value!.hasFriends = [friends[1]];
                    return value;
                });

                await db.friends.where(':id').equals(1).first(value => {
                    value!.hasFriends = [2];
                    return value;
                });

                await db.friends.populate({ shallow: true }).where(':id').equals(1).first(value => {
                    value!.hasFriends = [friends[1]];
                    return value;
                });


                // ===== Each (thenSchortcuts) =====

                await new Promise((res: (value: Friend) => void) =>
                    db.friends.each(x => res(x)));

                await new Promise((res: (value: Populated<Friend, true>) => void) =>
                    db.friends.populate({ shallow: true }).each(x => res(x)));

                await new Promise((res: (value: Friend) => void) =>
                    db.friends.where(':id').equals(1).each(x => res(x)));

                await new Promise((res: (value: Populated<Friend, true>) => void) =>
                    db.friends.populate({ shallow: true }).where(':id').equals(1).each(x => res(x)));

                expect(true).toBeTrue();
            });
        });
    });
});
