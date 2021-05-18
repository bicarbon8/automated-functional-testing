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

    it('can be used to wrap large blocks of code', async () => {
        await verify(async (v) => {
            let count: number = 10;
            let result: boolean = true;
            for (var i=0; i<count; i++) {
                await v.logMgr.info(`running count: ${i}`);
                await v.logMgr.warn(`random string: ${rand.getString()}`);
                result = result && expect(i).not.toBeNaN();
            }
            return count;
        }).withTestId('C1234').and.withTestId('C2345')
        .and.withDescription('some tests require lots of actions')
        .returns(10);
    });
});