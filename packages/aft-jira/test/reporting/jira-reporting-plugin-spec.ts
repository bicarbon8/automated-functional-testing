import * as fs from "fs";
import * as path from "path";
import { Reporter, AftConfig, pluginLoader } from "aft-core";
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
            plugins: ['jira-reporting-plugin'],
            JiraConfig: {
                openDefectOnFail: true,
                closeDefectOnPass: true
            }
        });
        const mgr: Reporter = new Reporter('can be loaded by the Reporter', aftCfg);
        const plugin = mgr.plugins[0];

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).toEqual('JiraReportingPlugin');
    });

    it('is enabled if either openDefectOnFail is true and closeDefectOnPass is false', async () => {
        const aftCfg = new AftConfig({
            plugins: ['jira-reporting-plugin'],
            JiraConfig: {
                openDefectOnFail: true,
                closeDefectOnPass: false
            }
        });
        const plugin = new JiraReportingPlugin(aftCfg);
        expect(plugin.enabled).toBeTrue();
    });

    it('is enabled if either closeDefectOnPass is true and openDefectOnFail is false', async () => {
        const aftCfg = new AftConfig({
            plugins: ['jira-reporting-plugin'],
            JiraConfig: {
                openDefectOnFail: false,
                closeDefectOnPass: true
            }
        });
        const plugin = new JiraReportingPlugin(aftCfg);
        expect(plugin.enabled).toBeTrue();
    });

    it('is not enabled if both closeDefectOnPass and openDefectOnFail are false', async () => {
        const aftCfg = new AftConfig({
            plugins: ['jira-reporting-plugin'],
            JiraConfig: {
                openDefectOnFail: false,
                closeDefectOnPass: false
            }
        });
        const plugin = new JiraReportingPlugin(aftCfg);
        expect(plugin.enabled).toBeFalse();
    });
});
