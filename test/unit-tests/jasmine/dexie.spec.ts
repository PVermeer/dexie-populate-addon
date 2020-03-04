import { Dexie as DexieImport } from 'dexie';

/*
 * Lib is not really meant for node but package should be able to be required in node.
 */
describe('Dexie', () => {
    describe('Node require', () => {
        let DexieReq: typeof DexieImport;
        beforeAll(() => {
            DexieReq = require('dexie');
        });
        it('should load Dexie.js', () => {
            expect(DexieReq).toBeTruthy();
        });
    });
});
