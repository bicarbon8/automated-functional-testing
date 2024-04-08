import { Reporter, rand, PolicyManager, Verifier, verify, TestResult, LogLevel, ProcessingResult, AftConfig, pluginLoader, containing, equaling } from "../../src";

let consoleLog = console.log;
describe('Verifier', () => {
    /* comment `beforeAll` and `afterAll` out to see actual test output */
    beforeAll(() => {
        console.log = function(){};
    });

    afterAll(() => {
        console.log = consoleLog;
    });
    
    beforeEach(() => {
        testStore.clear();
    });

    it('uses "description" as reporter name if provided', async () => {
        const description: string = rand.getString(22);
        await verify(async (v: Verifier) => {
            expect(v.reporter.loggerName).toEqual(description);
        })
        .withDescription(description);
    });

    it('uses "test case IDs" as reporter name if no description provided', async () => {
        const peMgr = new PolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await verify(async (v: Verifier) => {
            expect(v.reporter.loggerName).toEqual('C1234_C2345');
        })
        .withTestIds('C1234','C2345')
        .internals.usingPolicyManager(peMgr);
    });
    
    it('can execute a passing expectation', async () => {
        const reporter = new Reporter('can execute a passing expectation');
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'pass').and.callThrough();
        const peMgr = new PolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await verify(async (v: Verifier) => 'foo')
        .returns('foo')
        .internals.usingReporter(reporter)
        .internals.usingPolicyManager(peMgr)
        .and.withDescription('true should be true')
        .and.withTestIds('C1234','C2345');

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(reporter.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.pass).toHaveBeenCalledTimes(2);
    });

    it('accepts a VerifierMatcher in the returns function', async () => {
        const reporter = new Reporter('accepts a VerifierMatcher in the returns function');
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'pass').and.callThrough();
        const peMgr = new PolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await verify(async (v: Verifier) => ['foo', 'bar', 'baz'])
        .returns(containing('bar'))
        .internals.usingReporter(reporter)
        .internals.usingPolicyManager(peMgr)
        .and.withDescription('array contains "bar"')
        .and.withTestIds('C1234','C2345');

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(reporter.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.pass).toHaveBeenCalledTimes(2);
    });

    it('throws on exception in assertion', async () => {
        const reporter = new Reporter('throws on exception in assertion');
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'fail').and.callThrough();
        const peMgr = new PolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        try {
            await verify(() => {
                throw new Error('fake error');
            })
            .internals.usingReporter(reporter)
            .internals.usingPolicyManager(peMgr)
                .withDescription('true should be true')
            .and.withTestIds('C1234').and.withTestIds('C2345');

            expect(true).toBe(false); // force failure
        } catch (e) {
            expect(e.toString()).toEqual('Error: fake error');
        }

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(reporter.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.fail).toHaveBeenCalledTimes(2);
    });

    it('throws on failed comparison with expected result', async () => {
        const reporter = new Reporter('throws on failed comparison with expected result');
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'fail').and.callThrough();
        const peMgr = new PolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        try {
            await verify(() => true)
            .returns(false)
            .internals.usingReporter(reporter)
            .internals.usingPolicyManager(peMgr)
                .and.withDescription('failure expected due to true not being false')
            .and.withTestIds('C1234').and.withTestIds('C2345');

            expect('foo').toBe('bar'); // force failure
        } catch (e) {
            expect(e.toString()).toEqual(equaling(false).setActual(true).failureString());
        }

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(reporter.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.fail).toHaveBeenCalledTimes(2);
    });

    it('will not execute expectation if PolicyManager says should not run for all cases', async () => {
        const reporter = new Reporter('will not execute expectation if PolicyManager says should not run for all cases');
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'warn').and.callThrough();
        const peMgr = new PolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: false});
        });

        await verify(() => {
            testStore.set('executed', true);
        })
        .internals.usingReporter(reporter)
        .internals.usingPolicyManager(peMgr)
        .and.withTestIds('C1234','C2345');

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(testStore.has('executed')).toBeFalse();
        expect(reporter.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.warn).toHaveBeenCalledTimes(2);
    });

    it('will execute expectation if PolicyManager says any cases should be run', async () => {
        const reporter = new Reporter('will execute expectation if PolicyManager says any cases should be run');
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'pass').and.callThrough();
        const peMgr = new PolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            if (testId === 'C1234') {
                return Promise.resolve({result: false, message: 'do not run C1234'});
            } else {
                return Promise.resolve({result: true});
            }
        });

        await verify(() => {
            testStore.set('executed', true);
        })
        .internals.usingReporter(reporter)
        .internals.usingPolicyManager(peMgr)
        .and.withTestIds('C1234','C2345');

        expect(peMgr.shouldRun).toHaveBeenCalledWith('C1234');
        expect(peMgr.shouldRun).toHaveBeenCalledWith('C2345');
        expect(testStore.has('executed')).toBeTrue();
        expect(reporter.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.pass).toHaveBeenCalledTimes(2);
    });

    it('will not execute expectation if no associated testIds and PolicyManager has enabled plugins', async () => {
        const reporter = new Reporter('will not execute expectation if no associated testIds and PolicyManager has enabled plugins');
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'warn').and.callThrough();
        pluginLoader.reset();
        const peMgr = new PolicyManager(new AftConfig({
            plugins: ['mock-policy-plugin'],
            MockPolicyPluginConfig: {
                enabled: true
            }
        }));

        await verify(() => {
            testStore.set('executed', true);
        })
        .internals.usingReporter(reporter)
        .internals.usingPolicyManager(peMgr);

        expect(peMgr.plugins.length).toEqual(1);
        expect(testStore.has('executed')).toBeFalse();
        expect(reporter.submitResult).toHaveBeenCalledTimes(1);
        expect(reporter.warn).toHaveBeenCalledTimes(1);
    });

    it('assertion return value not checked if "returns" not used', async () => {
        await verify(() => {
            return 'foo';
        });
    });
});

const testStore: Map<string, any> = new Map<string, any>();
