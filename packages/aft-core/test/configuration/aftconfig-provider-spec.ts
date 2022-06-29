import * as path from 'path';
import { AftConfigProvider, JsonObject } from '../../src';
import { rand } from "../../src/helpers/rand";

describe('AftConfigProvider', () => {
    describe('aftConfig', () => {
        it('can read from aftconfig.json config file', () => {
            const aftcfg: JsonObject = new AftConfigProvider('any').aftConfig;
            let level: string = aftcfg['LogManager'].level;
    
            expect(level).not.toBeNull();
            expect(level).not.toBeUndefined();
            expect(level).toEqual('none');
        });

        it('can modify loaded aftconfig.json object', () => {
            const config = new AftConfigProvider('any');
            const aftcfg: JsonObject = config.aftConfig;
    
            let key: string = rand.getString(10);
            let val: string = rand.getString(11);
            aftcfg[key] = val;
    
            let aftcfg2: JsonObject = config.aftConfig;
    
            expect(aftcfg2[key]).toBe(val);
            delete(aftcfg[key]);
        });

        it('modifying loaded aftconfig.json object does not affect actual file', () => {
            const aftcfg: JsonObject = new AftConfigProvider('any').aftConfig;
    
            let key: string = rand.getString(10);
            let val: string = rand.getString(11);
            aftcfg[key] = val;
    
            let conf2: JsonObject = require(path.resolve(process.cwd(), 'aftconfig.json'));
    
            expect(conf2[key]).not.toBeDefined();
        });
    });
});