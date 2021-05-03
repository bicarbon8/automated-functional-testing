import { aftconfigMgr, OptionsManager, rand } from 'aft-core';
import { TestRailConfig, TestRailConfigOptions, trconfig } from "../../src/configuration/testrail-config";

describe('TestRailConfig', () => {
    it('can get the url from aftconfig.json file', async () => {
        let expectedUrl: string = 'http://fake.testrail.ie';
        let fakeKey: string = rand.getString(12, true);
        let optMgr: OptionsManager = new OptionsManager(fakeKey);
        let conf = await aftconfigMgr.aftConfig();
        conf[fakeKey] = {"url": expectedUrl} as TestRailConfigOptions;
        let trConfig: TestRailConfig = new TestRailConfig({
            user: null,
            accesskey: null,
            url: null,
            _optMgr: optMgr
        });
        let url: string = await trConfig.getUrl();

        expect(url).toEqual(expectedUrl);
    });

    it('project_id defaults to -1', async () => {
        let fakeKey: string = rand.getString(12, true);
        let optMgr: OptionsManager = new OptionsManager(fakeKey);
        let trConfig: TestRailConfig = new TestRailConfig({
            user: null,
            accesskey: null,
            url: null,
            _optMgr: optMgr
        });
        let projectId: number = await trConfig.getProjectId();

        expect(projectId).toBe(-1);
    });

    it('suite_ids defaults to empty array', async () => {
        let fakeKey: string = rand.getString(12, true);
        let optMgr: OptionsManager = new OptionsManager(fakeKey);
        let trConfig: TestRailConfig = new TestRailConfig({
            user: null,
            accesskey: null,
            url: null,
            _optMgr: optMgr
        });
        let suiteIds: number[] = await trConfig.getSuiteIds();

        expect(suiteIds.length).toBe(0);
    });

    it('plan_id defaults to -1', async () => {
        let fakeKey: string = rand.getString(12, true);
        let optMgr: OptionsManager = new OptionsManager(fakeKey);
        let trConfig: TestRailConfig = new TestRailConfig({
            user: null,
            accesskey: null,
            url: null,
            _optMgr: optMgr
        });
        let planId: number = await trConfig.getPlanId();

        expect(planId).toBe(-1);
    });
});