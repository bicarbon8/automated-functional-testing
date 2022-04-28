import { aftconfigMgr, OptionsManager, rand } from "../../src";

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
        const oMgr: OptionsManager = new OptionsManager('foo', {'bar': 'baz'});
        const getFromSpy = spyOn(aftconfigMgr, 'getFrom').and.callThrough();
        const getSpy = spyOn(aftconfigMgr, 'get').and.callThrough();

        const result: string = await oMgr.getOption('baz', 'expected');
        expect(result).toEqual('expected');
        expect(getFromSpy).toHaveBeenCalledTimes(1);
        expect(getSpy).toHaveBeenCalledTimes(1);
    });
});