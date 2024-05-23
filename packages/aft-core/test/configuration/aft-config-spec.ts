import { AftConfig, LogLevel, rand } from "../../src"

describe('AftConfig', () => {
    class FakeSectionConfig {
        option1: number = -1;
        option2: boolean = false;
        option3: string = "option3val";
    }

    it('can use a Class type to get an existing section from aftconfig', () => {
        const randomEnvVarKey = rand.getString(12);
        process.env[randomEnvVarKey] = rand.getString(15);
        const aftcfg = new AftConfig({
            FakeSectionConfig: {
                option1: 1,
                option2: true,
                option3: `%${randomEnvVarKey}%`
            }
        });

        const actual = aftcfg.getSection(FakeSectionConfig);
        expect(actual).not.toBeNull();
        expect(actual.option1).toEqual(1);
        expect(actual.option2).toEqual(true);
        expect(actual.option3).toEqual(process.env[randomEnvVarKey]);
    })

    it('can use a Class type to create a non-existing section from aftconfig', () => {
        const aftcfg = new AftConfig({});

        const expected = new FakeSectionConfig();
        const actual = aftcfg.getSection(FakeSectionConfig);
        expect(actual).not.toBeNull();
        expect(actual.option1).toEqual(expected.option1);
        expect(actual.option2).toEqual(expected.option2);
        expect(actual.option3).toEqual(expected.option3);
    })

    it('can load .js file', () => {
        /**
         * this test relies on having a valid `aftconfig.js` file
         * in the project root directory containing the following:
         * ```javascript
         * module.exports = {
         *    logLevel: 'none',
         *    plugins: [],
         *    ReporterConfig: {
         *        logLevel: 'none'
         *    }
         * };
         * ```
         */
        const aftcfg = new AftConfig();

        expect(aftcfg.logLevel).toEqual('none');
        expect(aftcfg.plugins.length).toBe(0);
        expect(aftcfg.getSection(ReporterConfig).logLevel).toEqual('none');
    })

    it('can parse env vars to expected types', () => {
        type BazType = {
            bt: string;
        };
        class FooBarBazConfig {
            foo: number;
            bar: boolean;
            baz: BazType;
        }
        const numKey = rand.getString(15);
        const boolKey = rand.getString(15);
        const objKey = rand.getString(15);
        const jsonStr = `{"FooBarBazConfig": {"foo": %${numKey}%, "bar": %${boolKey}%, "baz": %${objKey}%}}`;
        process.env[numKey] = '42';
        process.env[boolKey] = 'true';
        process.env[objKey] = '{"bt": "bt_value"}';

        const cfg = new AftConfig(jsonStr).getSection(FooBarBazConfig);

        expect(cfg.foo).toBe(42);
        expect(cfg.bar).toBeTrue();
        expect(cfg.baz).toBeDefined();
        expect(cfg.baz.bt).toEqual('bt_value');
    })
})

class ReporterConfig {
    logLevel: LogLevel = 'warn';
}
