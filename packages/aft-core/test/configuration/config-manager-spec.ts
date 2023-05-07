import { ConfigManager, rand } from "../../src"

describe('AftConfig', () => {
    class FakeSectionConfig {
        constructor() {}
        option1: number = -1;
        option2: boolean = false;
        option3: string = "option3val";
    };

    it('can use a Class type to get an existing section from aftconfig.json', () => {
        let randomEnvVarKey = rand.getString(12);
        process.env[randomEnvVarKey] = rand.getString(15);
        let aftcfg = new ConfigManager({
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

    it('can use a Class type to create a non-existing section from aftconfig.json', () => {
        let aftcfg = new ConfigManager({});

        let expected = new FakeSectionConfig();
        let actual = aftcfg.getSection(FakeSectionConfig);
        expect(actual).not.toBeNull();
        expect(actual.option1).toEqual(expected.option1);
        expect(actual.option2).toEqual(expected.option2);
        expect(actual.option3).toEqual(expected.option3);
    })
})