import { rand, verify } from "../src";

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
        await verify(() => (1 + 1)).returns(2).withDescription('1 plus 1 is 2');
    });

    it('can be used to wrap blocks of code', async () => {
        await verify(async (v) => {
            let count: number = 10;
            let result: boolean = true;
            v.pass('C1234');
            for (var i=0; i<count; i++) {
                await v.reporter.info(`running count: ${i}`);
                await v.reporter.warn(`random string: ${rand.getString()}`);
                result = result && !isNaN(i);
            }
            return count;
        }).withDescription('[C1234][C2345] some tests require lots of actions')
        .returns(10);
    }, 15000);
});