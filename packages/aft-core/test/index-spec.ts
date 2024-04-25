import { rand, aftTest, AftTest } from "../src";

var consoleLog = console.log;
describe('AFT', () => {
    /* comment `beforeAll` and `afterAll` out to see actual test output */
    beforeAll(() => {
        console.log = function(){};
    });

    afterAll(() => {
        console.log = consoleLog;
    });

    it('is simple to integrate into existing expectations', async () => {
        await aftTest('1 plus 1 is 2', async (v) => {
            await v.verify(1 + 1, 2);
        });
    });

    it('can be used to wrap blocks of code', async () => {
        await aftTest('[C1234][C2345] some tests require lots of actions', async (v: AftTest) => {
            let count: number = 10;
            let result: boolean = true;
            v.pass('C1234');
            for (var i=0; i<count; i++) {
                await v.reporter.info(`running count: ${i}`);
                await v.reporter.warn(`random string: ${rand.getString()}`);
                result = result && !isNaN(i);
            }
            await v.verify(count, 10);
        });
    }, 15000);
});