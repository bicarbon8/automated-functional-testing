import { TestCasePlugin, TestCaseManager } from "../../../src";

describe('TestCaseManager', () => {
    it('can load a specified TestCasePlugin', async () => {
        let tcpm: TestCaseManager = new TestCaseManager({pluginNames: ['mock-test-case-plugin']});
        let actual: TestCasePlugin[] = await tcpm.getPlugins();

        expect(actual).toBeDefined();
        expect(actual.length).toBeGreaterThan(0);
        expect(await actual[0].enabled()).toBeTruthy();
        expect(actual[0].optionsMgr.key).withContext('plugin should be instance of MockTestCasePlugin').toEqual('mocktestcaseplugin');
    });
});