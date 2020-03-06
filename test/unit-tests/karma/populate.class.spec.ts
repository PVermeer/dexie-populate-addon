import Dexie from 'dexie';
import { Populate } from '../../../src/populate.class';
import { DexieExt } from '../../../src/types';
import { databasesPositive, Friend, mockFriends } from '../../mocks/mocks';

describe('Populate class', () => {
    it('should memoize populated result', async () => {
        const db = databasesPositive[0].db(Dexie);
        const friends = mockFriends();
        const [ friend, ...hasFriends ] = friends;
        const ids = await db.friends.bulkAdd(friends);
        await db.friends.update(ids[0], {
            hasFriends
        });

        const populatedClass = new Populate<Friend, false, string>(
            [friend],
            { shallow: false },
            db as unknown as DexieExt,
            db.friends,
            (db as unknown as DexieExt)._relationalSchema
        );
        const getFriendPop = await populatedClass.populated;
        expect(getFriendPop[0].hasFriends.every(x => x instanceof Friend));

        const getFriendPop2 = await populatedClass.populated;
        expect(getFriendPop).toBe(getFriendPop2);
    });
});
