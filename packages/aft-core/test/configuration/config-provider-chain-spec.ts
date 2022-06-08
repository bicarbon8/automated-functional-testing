import { ChainedProvider, EnvVarProvider, OptionsProvider, rand } from "../../src";

describe('ConfigProviderChain', () => {
    it('will iterate through ConfigProvider instances', async () => {
        type FooBar = {
            foo?: string;
            fooz?: boolean;
        }
        const configKey: string = rand.getString(10);
        const env = new EnvVarProvider<FooBar>(configKey);
        const envStrSpy = spyOn(env, 'get').and.callThrough();
        const opt = new OptionsProvider<FooBar>({foo: 'foo-value'});
        const optStrSpy = spyOn(opt, 'get').and.callThrough();

        const chain = new ChainedProvider<FooBar>([env, opt]);

        const actualFoo: string = await chain.get('foo');
        const actualFooz: boolean = await chain.get('fooz', true);

        expect(actualFoo).toEqual('foo-value');
        expect(actualFooz).toBeTrue();
        expect(envStrSpy).toHaveBeenCalledTimes(2);
        expect(optStrSpy).toHaveBeenCalledTimes(2);
    });
});