import { cfgmgr, IConfigProvider } from "../../src";

describe('ConfigManager', () => {
    afterEach(() => {
        cfgmgr.reset();
    });

    it('can be overridden', async () => {
        class FakeProvider<T extends object> implements IConfigProvider<T> {
            async get<K extends keyof T, V extends T[K]>(key: K, defaultVal?: V): Promise<V> {
                switch(key) {
                    case 'foo':
                        return 'bar' as unknown as V;
                    case 'bar':
                        return 'foo' as unknown as V;
                }
            }
        }

        cfgmgr.set((configKey: string, options: object) => new FakeProvider());

        const actual = cfgmgr.get('any', {
            foo: 'foo',
            bar: 'bar'
        });

        expect(await actual.get('foo')).toEqual('bar');
        expect(await actual.get('bar')).toEqual('foo');
    });
});