import { optmgr, rand } from "../../src";

describe('OptionsManager', () => {
    it('can process environment vars', () => {
        const key = rand.getString(15);
        const val = rand.getString(200);
        const notexist = rand.getString(10);
        const options = {
            foo: `%${key}%`,
            bar: `${key}`,
            baz: `%${notexist}%`
        };
        process.env[key] = val;

        const actual = optmgr.process(options);

        expect(actual.foo).toEqual(val);
        expect(actual.bar).toEqual(key);
        expect(actual.baz).toEqual(`%${notexist}%`);
    });

    it('can process JSON', () => {
        const options = {
            foo: '["bar", true, 10]'
        };

        const actual = optmgr.process(options);

        expect(actual.foo.length).toBe(3);
        expect(actual.foo[0]).toEqual('bar');
        expect(actual.foo[1]).toBeTrue();
        expect(actual.foo[2]).toBe(JSON.parse('10'));
    });

    it('can process environment vars as JSON', () => {
        const key = rand.getString(15);
        const val = '["bar", true, 10]';
        const options = {
            foo: `%${key}%`
        };
        process.env[key] = val;

        const actual = optmgr.process(options);

        expect(actual.foo.length).toBe(3);
        expect(actual.foo[0]).toEqual('bar');
        expect(actual.foo[1]).toBeTrue();
        expect(actual.foo[2]).toBe(JSON.parse('10'));
    })
});