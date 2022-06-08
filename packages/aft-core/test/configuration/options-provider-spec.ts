import { OptionsProvider, rand } from "../../src";

describe('OptionsProvider', () => {
    it('can read from a simple object', async () => {
        type Bar = {bar: string;};
        const expected: string = rand.guid;
        const oMgr = new OptionsProvider<Bar>({'bar': expected});

        expect(expected.length).toBeGreaterThan(0);
        expect(await oMgr.get('bar')).toEqual(expected);
    });

    it('returns the default value if specified key not found internally', async () => {
        type FooBarBaz = {
            foo?: string;
            bar?: number;
            baz?: boolean;
        };
        const oMgr = new OptionsProvider<FooBarBaz>({bar: 10, baz: true});

        const result: string = await oMgr.get('foo', 'default-value-return');
        
        expect(result).withContext('result is valid').toBeDefined();
        expect(result).withContext('default value was returned').toEqual('default-value-return');
    });

    it('can load values from environment variables', async () => {
        let key: string = rand.getString(12);
        let envKey: string = rand.getString(14);
        let expected: string = rand.getString(9);
        process.env[envKey] = expected;
        const conf = new OptionsProvider({[`${key}`]: `%${envKey}%`});

        let actual: string = await conf.get(key, 'unexpected');
        expect(actual).not.toBeNull();
        expect(actual).toBe(expected);

        delete(process.env[envKey]);
    });

    it('will return original string if environment variable contains no data', async () => {
        let key: string = rand.getString(11);
        let envKey: string = rand.getString(12);
        let expected: string = `%${envKey}%`;
        const conf = new OptionsProvider({[`${key}`]: expected});

        let actual: string = await conf.get(key, 'unexpected');
        expect(actual).not.toBeNull();
        expect(actual).toBe(expected);
    });

    it('can handle passing in array as options', async () => {
        type FooArray = Array<{[x: string]: string}>;
        const expected: string = rand.guid;
        const oMgr = new OptionsProvider<FooArray>([{'bar': expected},{'baz': 'unexpected'}]);

        expect(await oMgr.get(0)).toEqual({'bar': expected});
    });

    it('can load JSON from environment variables', async () => {
        let key: string = rand.getString(12);
        let envKey: string = rand.getString(14);
        let expected: FooBar = {
            foo: rand.getString(9),
            bar: rand.getInt(999, 9999)
        };
        process.env[envKey] = JSON.stringify(expected);
        const conf = new OptionsProvider({[`${key}`]: `%${envKey}%`});

        let actual: FooBar = await conf.get(key, null);
        expect(actual).not.toBeNull();
        expect(actual.foo).toBe(expected.foo);
        expect(actual.bar).toBe(expected.bar);

        delete(process.env[envKey]);
    });
});

type FooBar = {
    foo: string;
    bar: number;
}