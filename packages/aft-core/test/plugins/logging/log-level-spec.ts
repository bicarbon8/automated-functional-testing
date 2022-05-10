import { LogLevel, LogManager, LogManagerOptions } from "../../../src";

const consoleLog = console.log;

describe('LogLevel', () => {
    beforeAll(() => {
        console.log = function(){};
    });

    afterAll(() => {
        console.log = consoleLog;
    });

    it('can be extended', async () => {
        const fancy: LogLevel = new LogLevel('fancy', 7);
        const opts: LogManagerOptions = {
            logName: 'LogLevel can be extended',
            pluginNames: [],
            level: 'trace'
        };
        const logMgr: LogManager = new LogManager(opts);
        const consoleSpy = spyOn(console, 'log').and.callThrough();

        await logMgr.log(fancy, 'fancy message');

        expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    const testData = [
        {in: 'trace', ex: LogLevel.trace},
        {in: 'debug', ex: LogLevel.debug},
        {in: 'info', ex: LogLevel.info},
        {in: 'step', ex: LogLevel.step},
        {in: 'warn', ex: LogLevel.warn},
        {in: 'pass', ex: LogLevel.pass},
        {in: 'fail', ex: LogLevel.fail},
        {in: 'error', ex: LogLevel.error},
        {in: 'none', ex: LogLevel.none}
    ];
    for (var i=0; i<testData.length; i++) {
        let data = testData[i];
        it(`can parse expected string: ${data.in}`, () => {
            const actual: LogLevel = LogLevel.parse(data.in);

            expect(actual.logString).withContext('logString').toEqual(data.ex.logString);
            expect(actual.name).withContext('name').toEqual(data.ex.name);
            expect(actual.value).withContext('value').toEqual(data.ex.value);
        });
    }
});