import { AftConfig, ResultsManager, TestResult, pluginLoader, rand } from "../../../src"
import { MockResultsPlugin } from "./mock-results-plugin";

describe('ResultsManager', () => {
    beforeEach(() => {
        pluginLoader.reset();
    })

    afterEach(() => {
        pluginLoader.reset();
    })

    it('can load a IResultsPlugin', () => {
        const resMgr = new ResultsManager(new AftConfig({
            pluginNames: ['mock-results-plugin'],
            MockResultsPluginConfig: {
                enabled: true
            }
        }));

        expect(resMgr.plugins.length).toBe(1);
        expect(resMgr.plugins[0].constructor.name).toEqual(MockResultsPlugin.name);
        expect(resMgr.plugins[0].enabled).toBeTrue();
    })

    it('sends cloned results to all loaded and enabled plugins', () => {
        const resMgr = new ResultsManager(new AftConfig({
            pluginNames: ['mock-results-plugin'],
            MockResultsPluginConfig: {
                enabled: true
            }
        }));
        const result: TestResult = {
            created: Date.now(),
            resultId: rand.guid,
            status: 'passed',
            testId: rand.guid,
            testName: 'sends results to all loaded and enabled plugins'
        }
        resMgr.submitResult(result);

        expect(resMgr.plugins.length).toBe(1);
        expect(resMgr.plugins[0].constructor.name).toEqual(MockResultsPlugin.name);
        expect(resMgr.plugins[0].enabled).toBeTrue();
        expect((resMgr.plugins[0] as MockResultsPlugin).results.length).toBe(1);
        expect((resMgr.plugins[0] as MockResultsPlugin).results[0].testId).toEqual(result.testId);

        const origName = result.testName;
        result.testName = rand.guid;
        expect((resMgr.plugins[0] as MockResultsPlugin).results[0].testName).toEqual(origName);
        expect((resMgr.plugins[0] as MockResultsPlugin).results[0].testName).not.toEqual(result.testName);
    })
})