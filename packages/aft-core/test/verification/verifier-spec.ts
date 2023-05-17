import { LogManager, rand, PolicyEngineManager, Verifier, verify, TestResult, LogLevel, ProcessingResult, AftConfig, pluginLoader, ResultsManager, containing, equaling } from "../../src";

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

    it('uses "description" as logMgr name if provided', async () => {
        let description: string = rand.getString(22);
        await verify(async (v: Verifier) => {
            expect(v.logMgr.logName).toEqual(description);
        })
        .withDescription(description);
    });

    it('uses "test case IDs" as logMgr name if no description provided', async () => {
        const peMgr = new PolicyEngineManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await verify(async (v: Verifier) => {
            expect(v.logMgr.logName).toEqual('C1234_C2345');
        })
        .withTestIds('C1234','C2345')
        .internals.usingPolicyEngineManager(peMgr);
    });
    
    it('can execute a passing expectation', async () => {
        const resMgr = new ResultsManager();
        spyOn(resMgr, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const logMgr = new LogManager('can execute a passing expectation');
        spyOn(logMgr, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(logMgr, 'pass').and.callThrough();
        const peMgr = new PolicyEngineManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await verify(async (v: Verifier) => 'foo')
        .returns('foo')
        .internals.usingLogManager(logMgr)
        .internals.usingPolicyEngineManager(peMgr)
        .internals.usingResultsManager(resMgr)
        .and.withDescription('true should be true')
        .and.withTestIds('C1234','C2345');

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(resMgr.submitResult).toHaveBeenCalledTimes(2);
        expect(logMgr.pass).toHaveBeenCalledTimes(2);
    });

    it('accepts a VerifierMatcher in the returns function', async () => {
        const resMgr = new ResultsManager();
        spyOn(resMgr, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const logMgr = new LogManager('accepts a VerifierMatcher in the returns function');
        spyOn(logMgr, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(logMgr, 'pass').and.callThrough();
        const peMgr = new PolicyEngineManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await verify(async (v: Verifier) => ['foo', 'bar', 'baz'])
        .returns(containing('bar'))
        .internals.usingLogManager(logMgr)
        .internals.usingPolicyEngineManager(peMgr)
        .internals.usingResultsManager(resMgr)
        .and.withDescription('array contains "bar"')
        .and.withTestIds('C1234','C2345');

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(resMgr.submitResult).toHaveBeenCalledTimes(2);
        expect(logMgr.pass).toHaveBeenCalledTimes(2);
    });

    it('throws on exception in assertion', async () => {
        const resMgr = new ResultsManager();
        spyOn(resMgr, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const logMgr = new LogManager('throws on exception in assertion');
        spyOn(logMgr, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(logMgr, 'fail').and.callThrough();
        const peMgr = new PolicyEngineManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        try {
            await verify(() => {
                throw new Error('fake error');
            })
            .internals.usingLogManager(logMgr)
            .internals.usingPolicyEngineManager(peMgr)
            .internals.usingResultsManager(resMgr)
            .withDescription('true should be true')
            .and.withTestIds('C1234').and.withTestIds('C2345');

            expect(true).toBe(false); // force failure
        } catch (e) {
            expect(e.toString()).toEqual('Error: fake error');
        }

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(resMgr.submitResult).toHaveBeenCalledTimes(2);
        expect(logMgr.fail).toHaveBeenCalledTimes(2);
    });

    it('throws on failed comparison with expected result', async () => {
        const resMgr = new ResultsManager();
        spyOn(resMgr, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const logMgr = new LogManager('throws on failed comparison with expected result');
        spyOn(logMgr, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(logMgr, 'fail').and.callThrough();
        const peMgr = new PolicyEngineManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        try {
            await verify(() => true)
            .returns(false)
            .internals.usingLogManager(logMgr)
            .internals.usingPolicyEngineManager(peMgr)
            .internals.usingResultsManager(resMgr)
            .and.withDescription('failure expected due to true not being false')
            .and.withTestIds('C1234').and.withTestIds('C2345');

            expect('foo').toBe('bar'); // force failure
        } catch (e) {
            expect(e.toString()).toEqual(equaling(false).setActual(true).failureString());
        }

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(resMgr.submitResult).toHaveBeenCalledTimes(2);
        expect(logMgr.fail).toHaveBeenCalledTimes(2);
    });

    it('will not execute expectation if PolicyEngineManager says should not run for all cases', async () => {
        const resMgr = new ResultsManager();
        spyOn(resMgr, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const logMgr = new LogManager('will not execute expectation if PolicyEngineManager says should not run for all cases');
        spyOn(logMgr, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(logMgr, 'warn').and.callThrough();
        const peMgr = new PolicyEngineManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: false});
        });

        await verify(() => {
            testStore.set('executed', true);
        })
        .internals.usingLogManager(logMgr)
        .internals.usingPolicyEngineManager(peMgr)
        .internals.usingResultsManager(resMgr)
        .and.withTestIds('C1234','C2345');

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(testStore.has('executed')).toBeFalse();
        expect(resMgr.submitResult).toHaveBeenCalledTimes(2);
        expect(logMgr.warn).toHaveBeenCalledTimes(2);
    });

    it('will execute expectation if PolicyEngineManager says any cases should be run', async () => {
        const resMgr = new ResultsManager();
        spyOn(resMgr, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const logMgr = new LogManager('will execute expectation if PolicyEngineManager says any cases should be run');
        spyOn(logMgr, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(logMgr, 'pass').and.callThrough();
        const peMgr = new PolicyEngineManager();
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
        .internals.usingLogManager(logMgr)
        .internals.usingPolicyEngineManager(peMgr)
        .internals.usingResultsManager(resMgr)
        .and.withTestIds('C1234','C2345');

        expect(peMgr.shouldRun).toHaveBeenCalledWith('C1234');
        expect(peMgr.shouldRun).toHaveBeenCalledWith('C2345');
        expect(testStore.has('executed')).toBeTrue();
        expect(resMgr.submitResult).toHaveBeenCalledTimes(2);
        expect(logMgr.pass).toHaveBeenCalledTimes(2);
    });

    it('will not execute expectation if no associated testIds and PolicyEngineManager has enabled plugins', async () => {
        const resMgr = new ResultsManager();
        spyOn(resMgr, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const logMgr = new LogManager('will not execute expectation if no associated testIds and PolicyEngineManager has enabled plugins');
        spyOn(logMgr, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(logMgr, 'warn').and.callThrough();
        pluginLoader.reset();
        const peMgr = new PolicyEngineManager(new AftConfig({
            pluginNames: ['mock-policy-engine-plugin'],
            MockPolicyEnginePluginConfig: {
                enabled: true
            }
        }));

        await verify(() => {
            testStore.set('executed', true);
        })
        .internals.usingLogManager(logMgr)
        .internals.usingPolicyEngineManager(peMgr)
        .internals.usingResultsManager(resMgr);

        expect(peMgr.plugins.length).toEqual(1);
        expect(testStore.has('executed')).toBeFalse();
        expect(resMgr.submitResult).toHaveBeenCalledTimes(1);
        expect(logMgr.warn).toHaveBeenCalledTimes(1);
    });

    it('assertion return value not checked if "returns" not used', async () => {
        await verify(() => {
            return 'foo';
        });
    });
});

const testStore: Map<string, any> = new Map<string, any>();