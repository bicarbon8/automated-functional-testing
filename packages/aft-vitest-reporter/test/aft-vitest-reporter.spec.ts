import { it, describe, expect, vi, TaskContext } from "vitest";
import { AftVitestTest, aftVitestTest } from "../src";
import { Retry, containing, retry } from "aft-core";

describe('AftVitestReporter', () => {
    it('passes a Vitest context to the test that can be used by AftVitestTest', async function(ctx: TaskContext) {
        const t = new AftVitestTest(ctx);
        const shouldRun = await t.shouldRun();
        if (!shouldRun.result) { 
            await t.pending(shouldRun.message);
        }
        expect(t).to.exist;
        expect(t.reporter).to.exist;
        expect(t.reporter.name).to.equal(t.description);

        await t.reporter.trace('sample log message');
    });

    it('can skip a test during execution', async (ctx: TaskContext) => {
        const t = new AftVitestTest(ctx);
        vi.spyOn(t, 'shouldRun').mockImplementation(() => Promise.resolve({result: false, message: 'fake'}));
        const shouldRun = await t.shouldRun();
        if (!shouldRun.result) { 
            await t.pending(shouldRun.message);
        }
        
        expect(true).to.be.false; // force failure if we get here
    });

    it('still works if using an arrow function', async (ctx: TaskContext) => {
        const t = new AftVitestTest(ctx);
        
        expect(t).to.exist;
        expect(t.reporter).to.exist;
        expect(t.description).to.contain('arrow function');
        expect(t.test).to.equal(ctx.task);
        expect(t.reporter.name).to.equal(t.description);

        await t.reporter.trace('sample log message from aft-vitest-reporter.spec with arrow function');
    });

    it('[C1234] provides a AftVitestTest instance for use in test control', async (ctx: TaskContext) => {
        await aftVitestTest(ctx, async (v: AftVitestTest) => {
            await v.verify(v.description, 'AftVitestReporter [C1234] provides a AftVitestTest instance for use in test control');
            await v.verify(v.testIds, containing('C1234'), 'expected to parse test ID from description');
        });
    });

    it('[C9999] allows retry to be wrapped around the aftVitestTest', {timeout: 6000}, async (ctx: TaskContext) => {
        let index = 0;
        await retry((r: Retry<AftVitestTest>) => aftVitestTest(ctx, async (t: AftVitestTest) => {
            await t.verify(index++, 2, '[C9999]');
        }, {
            additionalMetadata: {
                attempt: r.totalAttempts
            }
        }), {
            delay: 10,
            backOffType: 'linear',
            maxDuration: 5000
        }).until((t: AftVitestTest) => t.status === 'passed');
    });
});
