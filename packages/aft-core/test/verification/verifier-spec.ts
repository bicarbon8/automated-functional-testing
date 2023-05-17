import { Reporter, rand, TestExecutionPolicyManager, Verifier, verify, TestResult, LogLevel, ProcessingResult, AftConfig, pluginLoader, ResultsManager, containing, equaling } from "../../src";

var consoleLog = console.log;
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
        let description: string = rand.getString(22);
        await verify(async (v: Verifier) => {
            expect(v.reporter.reporterName).toEqual(description);
        })
        .withDescription(description);
    });

    it('uses "test case IDs" as reporter name if no description provided', async () => {
        const peMgr = new TestExecutionPolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await verify(async (v: Verifier) => {
            expect(v.reporter.reporterName).toEqual('C1234_C2345');
        })
        .withTestIds('C1234','C2345')
        .internals.usingTestExecutionPolicyManager(peMgr);
    });
    
    it('can execute a passing expectation', async () => {
        const resMgr = new ResultsManager();
        spyOn(resMgr, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const reporter = new Reporter('can execute a passing expectation');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'pass').and.callThrough();
        const peMgr = new TestExecutionPolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await verify(async (v: Verifier) => 'foo')
        .returns('foo')
        .internals.usingReporter(reporter)
        .internals.usingTestExecutionPolicyManager(peMgr)
        .internals.usingResultsManager(resMgr)
        .and.withDescription('true should be true')
        .and.withTestIds('C1234','C2345');

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(resMgr.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.pass).toHaveBeenCalledTimes(2);
    });

    it('accepts a VerifierMatcher in the returns function', async () => {
        const resMgr = new ResultsManager();
        spyOn(resMgr, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const reporter = new Reporter('accepts a VerifierMatcher in the returns function');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'pass').and.callThrough();
        const peMgr = new TestExecutionPolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await verify(async (v: Verifier) => ['foo', 'bar', 'baz'])
        .returns(containing('bar'))
        .internals.usingReporter(reporter)
        .internals.usingTestExecutionPolicyManager(peMgr)
        .internals.usingResultsManager(resMgr)
        .and.withDescription('array contains "bar"')
        .and.withTestIds('C1234','C2345');

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(resMgr.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.pass).toHaveBeenCalledTimes(2);
    });

    it('throws on exception in assertion', async () => {
        const resMgr = new ResultsManager();
        spyOn(resMgr, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const reporter = new Reporter('throws on exception in assertion');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'fail').and.callThrough();
        const peMgr = new TestExecutionPolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        try {
            await verify(() => {
                throw new Error('fake error');
            })
            .internals.usingReporter(reporter)
            .internals.usingTestExecutionPolicyManager(peMgr)
            .internals.usingResultsManager(resMgr)
            .withDescription('true should be true')
            .and.withTestIds('C1234').and.withTestIds('C2345');

            expect(true).toBe(false); // force failure
        } catch (e) {
            expect(e.toString()).toEqual('Error: fake error');
        }

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(resMgr.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.fail).toHaveBeenCalledTimes(2);
    });

    it('throws on failed comparison with expected result', async () => {
        const resMgr = new ResultsManager();
        spyOn(resMgr, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const reporter = new Reporter('throws on failed comparison with expected result');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'fail').and.callThrough();
        const peMgr = new TestExecutionPolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        try {
            await verify(() => true)
            .returns(false)
            .internals.usingReporter(reporter)
            .internals.usingTestExecutionPolicyManager(peMgr)
            .internals.usingResultsManager(resMgr)
            .and.withDescription('failure expected due to true not being false')
            .and.withTestIds('C1234').and.withTestIds('C2345');

            expect('foo').toBe('bar'); // force failure
        } catch (e) {
            expect(e.toString()).toEqual(equaling(false).setActual(true).failureString());
        }

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(resMgr.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.fail).toHaveBeenCalledTimes(2);
    });

    it('will not execute expectation if TestExecutionPolicyManager says should not run for all cases', async () => {
        const resMgr = new ResultsManager();
        spyOn(resMgr, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const reporter = new Reporter('will not execute expectation if TestExecutionPolicyManager says should not run for all cases');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'warn').and.callThrough();
        const peMgr = new TestExecutionPolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: false});
        });

        await verify(() => {
            testStore.set('executed', true);
        })
        .internals.usingReporter(reporter)
        .internals.usingTestExecutionPolicyManager(peMgr)
        .internals.usingResultsManager(resMgr)
        .and.withTestIds('C1234','C2345');

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(testStore.has('executed')).toBeFalse();
        expect(resMgr.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.warn).toHaveBeenCalledTimes(2);
    });

    it('will execute expectation if TestExecutionPolicyManager says any cases should be run', async () => {
        const resMgr = new ResultsManager();
        spyOn(resMgr, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const reporter = new Reporter('will execute expectation if TestExecutionPolicyManager says any cases should be run');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'pass').and.callThrough();
        const peMgr = new TestExecutionPolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            if (testId == 'C1234') {
                return Promise.resolve({result: false, message: 'do not run C1234'});
            } else {
                return Promise.resolve({result: true});
            }
        });

        await verify(() => {
            testStore.set('executed', true);
        })
        .internals.usingReporter(reporter)
        .internals.usingTestExecutionPolicyManager(peMgr)
        .internals.usingResultsManager(resMgr)
        .and.withTestIds('C1234','C2345');

        expect(peMgr.shouldRun).toHaveBeenCalledWith('C1234');
        expect(peMgr.shouldRun).toHaveBeenCalledWith('C2345');
        expect(testStore.has('executed')).toBeTrue();
        expect(resMgr.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.pass).toHaveBeenCalledTimes(2);
    });

    it('will not execute expectation if no associated testIds and TestExecutionPolicyManager has enabled plugins', async () => {
        const resMgr = new ResultsManager();
        spyOn(resMgr, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const reporter = new Reporter('will not execute expectation if no associated testIds and TestExecutionPolicyManager has enabled plugins');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'warn').and.callThrough();
        pluginLoader.reset();
        const peMgr = new TestExecutionPolicyManager(new AftConfig({
            pluginNames: ['mock-policy-engine-plugin'],
            MockTestExecutionPolicyPluginConfig: {
                enabled: true
            }
        }));

        await verify(() => {
            testStore.set('executed', true);
        })
        .internals.usingReporter(reporter)
        .internals.usingTestExecutionPolicyManager(peMgr)
        .internals.usingResultsManager(resMgr);

        expect(peMgr.plugins.length).toEqual(1);
        expect(testStore.has('executed')).toBeFalse();
        expect(resMgr.submitResult).toHaveBeenCalledTimes(1);
        expect(reporter.warn).toHaveBeenCalledTimes(1);
    });

    it('assertion return value not checked if "returns" not used', async () => {
        await verify(() => {
            return 'foo';
        });
    });
});

const testStore: Map<string, any> = new Map<string, any>();