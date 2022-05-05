import { aftconfig, OptionsManager, rand } from "../../src";

describe('OptionsManager', () => {
    it('can read from a simple object', async () => {
        const expected: string = rand.guid;
        const oMgr: OptionsManager = new OptionsManager('foo', {'bar': expected});

        expect(expected.length).toBeGreaterThan(0);
        expect(await oMgr.getOption<string>('bar')).toEqual(expected);
    });

    it('throws error on passing in array as options', async () => {
        expect(() => new OptionsManager('foo', ['bar', 'baz'])).toThrow('options must be a plain JSON object like "{key: val}" and not an Array');
    });

    it('falls back to AftConfig if key not found in options object', async () => {
        const oMgr: OptionsManager = new OptionsManager('loggingpluginmanager', {'bar': 'baz'});

        const result: string = await oMgr.getOption('level', 'does-not-exist');
        expect(result).toEqual(await aftconfig.get('loggingpluginmanager.level', 'does-not-exist'));
    });
});