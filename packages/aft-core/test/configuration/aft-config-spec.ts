import { AftConfig, Reporter, rand } from "../../src"

describe('AftConfig', () => {
    class FakeSectionConfig {
        constructor() {}
        option1: number = -1;
        option2: boolean = false;
        option3: string = "option3val";
    };

    it('can use a Class type to get an existing section from aftconfig', () => {
        let randomEnvVarKey = rand.getString(12);
        process.env[randomEnvVarKey] = rand.getString(15);
        let aftcfg = new AftConfig({
            FakeSectionConfig: {
                option1: 1,
                option2: true,
                option3: `%${randomEnvVarKey}%`
            }
        });

        let actual = aftcfg.getSection(FakeSectionConfig);
        expect(actual).not.toBeNull();
        expect(actual.option1).toEqual(1);
        expect(actual.option2).toEqual(true);
        expect(actual.option3).toEqual(process.env[randomEnvVarKey]);
    })

    it('can use a Class type to create a non-existing section from aftconfig', () => {
        let aftcfg = new AftConfig({});

        let expected = new FakeSectionConfig();
        let actual = aftcfg.getSection(FakeSectionConfig);
        expect(actual).not.toBeNull();
        expect(actual.option1).toEqual(expected.option1);
        expect(actual.option2).toEqual(expected.option2);
        expect(actual.option3).toEqual(expected.option3);
    })

    it('can load .js file', () => {
        const aftcfg = new AftConfig();

        expect(aftcfg.logLevel).toEqual('none');
        expect(aftcfg.pluginNames.length).toBe(0);
        expect(aftcfg.getSection(Reporter).logLevel).toEqual('none');
    })
})