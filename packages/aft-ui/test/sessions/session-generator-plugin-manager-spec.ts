import { FakeSession } from "./fake-session";
import { testdata } from "./test-data-helper";
import { ISession, SessionGeneratorPluginManager, TestPlatform } from "../../src";
import { FakeDriver } from "./fake-driver";
import { aftconfigMgr, IPluginManagerOptions, OptionsManager, rand } from "aft-core";

describe('SessionGeneratorPluginManager', () => {
    beforeEach(() => {
        testdata.reset();
    });
    
    it('can load session plugin by name', async () => {
        let mgr: SessionGeneratorPluginManager = new SessionGeneratorPluginManager({
            pluginNames: ['fake-session-generator-plugin'],
            searchDir: './dist/test'
        });
        let fs: ISession = await mgr.newSession();

        expect(fs).toBeDefined();
        expect(fs.driver).toBeDefined();
        expect(fs.driver instanceof FakeDriver).toBeTruthy();
    });

    it('Promise rejected if named session provider not found', async () => {
        let provider: string = 'nonexisting';
        let mgr: SessionGeneratorPluginManager = new SessionGeneratorPluginManager({
            pluginNames: [provider],
            searchDir: './dist/test'
        });
        await mgr.newSession()
            .then((session) => {
                /* not expected */
                expect(true).toEqual(false);
            }).catch((reason) => {
                expect(reason).toEqual(`unable to load plugin: '${provider}' due to: Error: plugin could not be located`);
            });
    });

    it('handles exceptions thrown by AbstractSessionGeneratorPlugin implementations', async () => {
        let provider: string = 'fake-session-generator-plugin-throws';
        let mgr: SessionGeneratorPluginManager = new SessionGeneratorPluginManager({
            pluginNames: [provider],
            searchDir: './dist/test'
        });
        await mgr.newSession()
            .then((session) => {
                /* not expected */
                expect(true).toEqual(false);
            }).catch((reason: Error) => {
                expect(reason.message).toEqual('Method not implemented.');
                expect(testdata.get('constructor')).toBeDefined();
                expect(testdata.get<IPluginManagerOptions>('constructor').pluginNames).toContain(provider);
            });
    });

    it('sets the plugin from aftconfig.json if not sent in options', async () => {
        let platform: string = 'windows_10_chrome';
        let provider: string = 'fake-session-generator-plugin';
        let configKey: string = rand.getString(15);
        await aftconfigMgr.aftConfig().then((config) => {
            config[configKey] = {
                "pluginNames": [provider],
                searchDir: './dist/test'
            }
        });
        let customOptMgr: OptionsManager = new OptionsManager(configKey);

        let mgr: SessionGeneratorPluginManager = new SessionGeneratorPluginManager({platform: platform, _optMgr: customOptMgr});
        let fs: ISession = await mgr.newSession();

        expect(fs).toBeDefined();
        expect(fs instanceof FakeSession).toBeTruthy();
    });
});