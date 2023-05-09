import { AftConfig, IPlugin, pluginLoader } from "../../src"
import { MockPlugin } from "./mock-plugin";

describe('PluginLoader', () => {
    beforeEach(() => {
        pluginLoader.reset();
    })

    afterEach(() => {
        pluginLoader.reset();
    })
    
    fit('can load a class implementing IPlugin', () => {
        const plugins = pluginLoader.getPluginsByType<IPlugin>('mock', new AftConfig({
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