import { mockFriends, mockClubs, Friend, Club } from '../../mocks/mocks';

describe('Mocks', () => {
    it('should be able to mock friends', () => {
        const friends = mockFriends();
        expect(friends.length).toBe(5);
        expect(friends.every(x => x instanceof Friend)).toBeTrue();
    });
    it('should be able to mock clubs', () => {
        const clubs = mockClubs();
        expect(clubs.length).toBe(5);
        expect(clubs.every(x => x instanceof Club)).toBeTrue();
    });
});
