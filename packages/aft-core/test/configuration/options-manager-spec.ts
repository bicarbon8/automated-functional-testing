import { aftconfig, OptionsManager, rand } from "../../src";

describe('OptionsManager', () => {
    it('can read from a simple object', async () => {
        const expected: string = rand.guid;
        const oMgr: OptionsManager = new OptionsManager('foo', {'bar': expected});

        expect(expected.length).toBeGreaterThan(0);
        expect(await oMgr.get<string>('bar')).toEqual(expected);
    });

    it('can handle passing in array as options', async () => {
        const expected: string = rand.guid;
        const oMgr: OptionsManager = new OptionsManager('foo', [{'bar': expected},{'baz': 'unexpected'}]);

        expect(await oMgr.get<string>('0.bar')).toEqual(expected);
    });

    it('falls back to AftConfig if key not found in options object', async () => {
        const oMgr: OptionsManager = new OptionsManager('loggingpluginmanager', {'bar': 'baz'});

        const result: string = await oMgr.get('level', 'does-not-exist');
        expect(result).toEqual(await aftconfig.get('loggingpluginmanager.level', 'does-not-exist'));
    });

    it('returns a merged options object if no keys passed in', async () => {
        const oMgr: OptionsManager = new OptionsManager('loggingpluginmanager', {'bar': 'baz'});

        const result: Record<string, any> = await oMgr.get();
        expect(result.bar).toEqual('baz');
        expect(result.level).toEqual(await aftconfig.get('loggingpluginmanager.level', 'not-found'));
    });
});