import * as fs from "fs";
import * as path from "path";
import { TestRailConfig, TestRailConfigOptions } from "../../src/configuration/testrail-config";

describe('TestRailConfig', () => {
    beforeEach(() => {
        const cachePath: string = path.join(process.cwd(), 'FileSystemMap');
        if (fs.existsSync(cachePath)) {
            fs.rmSync(cachePath, {recursive: true, force: true});
        }
    });

    it('can get the url from config options', async () => {
        let expectedUrl: string = 'http://fake.testrail.ie';
        const opts: TestRailConfigOptions = {
            user: null,
            accesskey: null,
            url: expectedUrl
        };
        let trConfig: TestRailConfig = new TestRailConfig(opts);
        let url: string = await trConfig.url();

        expect(url).toEqual(expectedUrl);
    });

    it('project_id defaults to -1', async () => {
        const opts: TestRailConfigOptions = {
            user: null,
            accesskey: null,
            url: null
        };
        let trConfig: TestRailConfig = new TestRailConfig(opts);
        const projectId: number = await trConfig.projectId();

        expect(projectId).toBe(-1);
    });

    it('suite_ids defaults to empty array', async () => {
        const opts: TestRailConfigOptions = {
            user: null,
            accesskey: null,
            url: null
        };
        let trConfig: TestRailConfig = new TestRailConfig(opts);
        let suiteIds: number[] = await trConfig.suiteIds();

        expect(suiteIds.length).toBe(0);
    });

    it('plan_id defaults to -1', async () => {
        const opts: TestRailConfigOptions = {
            user: null,
            accesskey: null,
            url: null
        };
        let trConfig: TestRailConfig = new TestRailConfig(opts);
        let planId: number = await trConfig.planId();

        expect(planId).toBe(-1);
    });
});