import { AftConfig, AftLogger, LogLevel, rand } from "../../src"

describe('AftLogger', () => {
    it('gets its logLevel from aftconfig.json', () => {
        const aftCfg = new AftConfig({
            logLevel: 'trace'
        });
        const logger = new AftLogger(null, aftCfg);

        expect(logger.logLevel).toEqual('trace');
    })

    it('will not log or format data at a logLevel below the configured logLevel', () => {
        const aftCfg = new AftConfig({
            logLevel: 'warn'
        });
        const logger = new AftLogger(null, aftCfg);
        spyOn(logger, 'toConsole').and.callFake((level: LogLevel, message: string) => null);
        spyOn(logger, 'format').and.callThrough();

        logger.log({name: rand.getString(10), level: 'trace', message: 'trace'});
        logger.log({name: rand.getString(10), level: 'debug', message: 'debug'});
        logger.log({name: rand.getString(10), level: 'info', message: 'info'});
        logger.log({name: rand.getString(10), level: 'warn', message: 'warn'});
        logger.log({name: rand.getString(10), level: 'error', message: 'error'});

        expect(logger.toConsole).toHaveBeenCalledTimes(2);
        expect(logger.format).toHaveBeenCalledTimes(2);
    })
})
