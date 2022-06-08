import { LogManager, rand } from "aft-core";
import { FakeSessionGeneratorManager, FakeSessionGeneratorManagerOptions } from "./fake-session-generator-manager";

describe('UiSessionGeneratorManager', () => {
    it('can be extended by a class instance', async () => {
        const config = {
            logName: rand.getString(25),
            plugins: ['fake-session-generator-plugin']
        };
        const manager = new FakeSessionGeneratorManager(config);

        expect(manager).toBeDefined();
        expect(await manager.logMgr().then((l) => l.logName)).toEqual(config.logName);
        expect(await manager.first().then((f) => f.constructor.name)).toEqual('FakeSessionGeneratorPlugin');
        expect(await manager.newUiSession()).toBeDefined();
    });

    it('can handle a defective plugin', async () => {
        const config = {
            plugins: ['fake-session-generator-plugin-throws']
        } as FakeSessionGeneratorManagerOptions;
        const manager = new FakeSessionGeneratorManager(config);

        expect(manager).toBeDefined();
        expect(await manager.logMgr().then((l) => l.logName)).toEqual(manager.constructor.name);
        expect(await manager.first().then((f) => f.constructor.name)).toEqual('FakeSessionGeneratorPluginThrows');
        expect(await manager.newUiSession()).toBeNull();
    });
});