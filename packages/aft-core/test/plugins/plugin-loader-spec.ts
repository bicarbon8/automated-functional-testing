import { AftConfig, Plugin, pluginLoader } from "../../src"
import { MockPlugin } from "./mock-plugin";

describe('PluginLoader', () => {
    beforeEach(() => {
        pluginLoader.reset();
    })

    afterEach(() => {
        pluginLoader.reset();
    })
    
    it('can load a class implementing IPlugin', () => {
        const plugins = pluginLoader.getPluginsByType(Plugin, new AftConfig({
            pluginNames: ['mock-plugin'],
            MockPluginConfig: {
                enabled: true
            }
        }));

        expect(plugins.length).toBe(1);
        expect(plugins[0].constructor.name).toEqual(MockPlugin.name);
        expect(plugins[0].enabled).toBeTrue();
    })
})