import { AftConfig, Plugin, pluginLoader } from "../../src"
import { MockPlugin } from "./mock-plugin";

describe('PluginLoader', () => {
    beforeEach(() => {
        pluginLoader.reset();
    })

    afterEach(() => {
        pluginLoader.reset();
    })

    describe('getPluginByName', () => {
        it('can load a plugin by name', () => {
            const plugin = pluginLoader.getPluginByName<MockPlugin>('mock-plugin', new AftConfig({
                plugins: ['mock-plugin'],
                MockPluginConfig: {
                    enabled: true
                }
            }));

            expect(plugin.constructor.name).toEqual(MockPlugin.name);
            expect(plugin.enabled).toBeTrue();
        })

        it('will still return a plugin if not enabled', () => {
            const plugin = pluginLoader.getPluginByName<MockPlugin>('mock-plugin', new AftConfig({
                plugins: ['mock-plugin'],
                MockPluginConfig: {
                    enabled: false
                }
            }));

            expect(plugin.constructor.name).toEqual(MockPlugin.name);
            expect(plugin.enabled).toBeFalse();
        })
    })
    
    describe('getPluginsByType', () => {
        it('can load a class implementing IPlugin', () => {
            const plugins = pluginLoader.getPluginsByType(Plugin, new AftConfig({
                plugins: ['mock-plugin'],
                MockPluginConfig: {
                    enabled: true
                }
            }));

            expect(plugins.length).toBe(1);
            expect(plugins[0].constructor.name).toEqual(MockPlugin.name);
            expect(plugins[0].enabled).toBeTrue();
        })

        it('will return a plugin if not enabled', () => {
            const plugins = pluginLoader.getPluginsByType(Plugin, new AftConfig({
                plugins: ['mock-plugin'],
                MockPluginConfig: {
                    enabled: false
                }
            }));

            expect(plugins.length).toBe(1);
            expect(plugins[0].constructor.name).toEqual(MockPlugin.name);
            expect(plugins[0].enabled).toBeFalse();
        })
    });

    describe('getEnabledPluginsByType', () => {
        it('will not return a plugin if not enabled', () => {
            const plugins = pluginLoader.getEnabledPluginsByType(Plugin, new AftConfig({
                plugins: ['mock-plugin'],
                MockPluginConfig: {
                    enabled: false
                }
            }));

            expect(plugins.length).toBe(0);
        })
    });
})