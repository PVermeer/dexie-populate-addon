import { Club, Friend, Group, mockClubs, mockFriends, mockGroups, mockThemes, Theme } from './mocks';

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
    it('should be able to mock themes', () => {
        const themes = mockThemes();
        expect(themes.length).toBe(5);
        expect(themes.every(x => x instanceof Theme)).toBeTrue();
    });
    it('should be able to mock groups', () => {
        const groups = mockGroups();
        expect(groups.length).toBe(5);
        expect(groups.every(x => x instanceof Group)).toBeTrue();
    });
});
