import * as fs from "fs";
import * as path from "path";
import { rand, TestResult, ellide, Reporter, AftConfig, pluginLoader } from "aft-core";
import { JiraApi } from "../../src/api/jira-api";
import { httpService } from "aft-web-services";
import {  } from "../../src/api/jira-custom-types";
import { JiraReportingPlugin } from "../../src";

describe('JiraReportingPlugin', () => {
    beforeEach(() => {
        spyOn(httpService, 'performRequest').and.returnValue(Promise.resolve({
            headers: {'content-type': 'application/json'},
            statusCode: 200,
            data: '{}'
        }));
        const cachePath: string = path.join(process.cwd(), 'FileSystemMap');
        if (fs.existsSync(cachePath)) {
            fs.rmSync(cachePath, {recursive: true, force: true});
        }
        pluginLoader.reset();
    });
    
    afterEach(() => {
        pluginLoader.reset();
    });

    it('can be loaded by the Reporter', async () => {
        const aftCfg = new AftConfig({
            pluginNames: ['jira-reporting-plugin']
        });
        const mgr: Reporter = new Reporter('can be loaded by the Reporter', aftCfg);
        const plugin = mgr.plugins[0];

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).toEqual('JiraReportingPlugin');
    });
});
