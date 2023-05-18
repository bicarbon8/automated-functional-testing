import { LogLevel } from "../../src";

const consoleLog = console.log;

describe('LogLevel', () => {
    beforeAll(() => {
        console.log = function(){};
    });

    afterAll(() => {
        console.log = consoleLog;
    });

    const testData = [
        {in: 'trace', val: 0, is: true},
        {in: 'debug', val: 1, is: true},
        {in: 'info', val: 2, is: true},
        {in: 'step', val: 3, is: true},
        {in: 'warn', val: 4, is: true},
        {in: 'pass', val: 5, is: true},
        {in: 'fail', val: 6, is: true},
        {in: 'error', val: 7, is: true},
        {in: 'none', val: 8, is: true},
        {in: 'foo', val: 8, is: false},
        {in: null, val: 8, is: false}
    ];
    for (var i=0; i<testData.length; i++) {
        let data = testData[i];
        it(`can parse string into LogLevel: ${data.in}`, () => {
            const actual: number = LogLevel.toValue(data.in);

            expect(actual).withContext('number').toEqual(data.val);
            expect(LogLevel.isType(data.in)).withContext('isType').toBe(data.is);
        });
    }
});