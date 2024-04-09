import {
    Reporter,
    rand,
    PolicyManager,
    AftTest,
    aftTest,
    TestResult,
    LogLevel,
    ProcessingResult,
    AftConfig,
    pluginLoader,
    containing,
    equaling,
    AftTestEvent,
    Func
} from "../../src";

const consoleLog = console.log;
describe('AftTest', () => {
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
        await aftTest(description, async (v: AftTest) => {
            await v.verify(v.reporter.loggerName, description);
        });
    });
    
    it('can execute a passing expectation', async () => {
        const reporter = new Reporter('can execute a passing expectation');
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'pass').and.callThrough();
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await aftTest('true [C1234] should be true [C2345]', async (v: AftTest) => {
            await v.verify(() => 'foo', 'foo');
        }, { reporter, policyManager });

        expect(policyManager.shouldRun).toHaveBeenCalledTimes(2);
        expect(reporter.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.pass).toHaveBeenCalledTimes(2);
    });

    it('accepts a VerifierMatcher in the returns function', async () => {
        const reporter = new Reporter('accepts a VerifierMatcher in the returns function');
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'pass').and.callThrough();
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await aftTest('[C1234][C2345] array contains "bar"', async (v: AftTest) => {
            await v.verify(['foo', 'bar', 'baz'], containing('bar'));
        }, { reporter, policyManager });

        expect(policyManager.shouldRun).toHaveBeenCalledTimes(2);
        expect(reporter.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.pass).toHaveBeenCalledTimes(2);
    });

    it('throws on exception in assertion', async () => {
        const reporter = new Reporter('throws on exception in assertion');
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'fail').and.callThrough();
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        try {
            await aftTest('true should [C1234][C2345] be true', () => {
                throw new Error('fake error');
            }, { reporter, policyManager });

            expect(true).toBe(false); // force failure
        } catch (e) {
            expect(e.toString()).toEqual('Error: fake error');
        }

        expect(policyManager.shouldRun).toHaveBeenCalledTimes(2);
        expect(reporter.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.fail).toHaveBeenCalledTimes(2);
    });

    it('throws on failed comparison with expected result', async () => {
        const reporter = new Reporter('throws on failed comparison with expected result');
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'fail').and.callThrough();
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        try {
            await aftTest('[C1234][C2345] failure expected due to true not being false', async (v: AftTest) => {
                await v.verify(true, false); // expected failure
            }, { reporter, policyManager });

            expect('foo').toBe('bar'); // force failure if we get here
        } catch (e) {
            expect(e.toString()).toContain(equaling(false).setActual(true).failureString());
        }

        expect(policyManager.shouldRun).toHaveBeenCalledTimes(2);
        expect(reporter.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.fail).toHaveBeenCalledTimes(2);
    });

    it('will not execute expectation if PolicyManager says should not run for all cases', async () => {
        const reporter = new Reporter('will not execute expectation if PolicyManager says should not run for all cases');
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'warn').and.callThrough();
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: false});
        });

        await aftTest('[C1234][C2345]', () => {
            testStore.set('executed', true);
        }, { reporter, policyManager });

        expect(policyManager.shouldRun).toHaveBeenCalledTimes(2);
        expect(testStore.has('executed')).toBeFalse();
        expect(reporter.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.warn).toHaveBeenCalledTimes(2);
    });

    it('will execute expectation if PolicyManager says any cases should be run', async () => {
        const reporter = new Reporter('will execute expectation if PolicyManager says any cases should be run');
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'pass').and.callThrough();
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            if (testId === 'C1234') {
                return Promise.resolve({result: false, message: 'do not run C1234'});
            } else {
                return Promise.resolve({result: true});
            }
        });

        await aftTest('[C1234][C2345]', () => {
            testStore.set('executed', true);
        }, { reporter, policyManager });

        expect(policyManager.shouldRun).toHaveBeenCalledWith('C1234');
        expect(policyManager.shouldRun).toHaveBeenCalledWith('C2345');
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
        const policyManager = new PolicyManager(new AftConfig({
            plugins: ['mock-policy-plugin'],
            MockPolicyPluginConfig: {
                enabled: true
            }
        }));

        await aftTest(rand.getString(15), () => {
            testStore.set('executed', true);
        }, { reporter, policyManager });

        expect(policyManager.plugins.length).toEqual(1);
        expect(testStore.has('executed')).toBeFalse();
        expect(reporter.submitResult).toHaveBeenCalledTimes(1);
        expect(reporter.warn).toHaveBeenCalledTimes(1);
    });

    it('will only log a result for a given test ID one time', async () => {
        const reporter = new Reporter('will only log a result for a given test ID one time');
        spyOn(reporter, 'pass').and.callFake((message: string) => Promise.resolve());
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await aftTest('[C1234] true should be true', async (v: AftTest) => {
            await v.pass('C1234');
        }, { reporter, policyManager });

        expect(policyManager.shouldRun).toHaveBeenCalledTimes(1);
        expect(reporter.submitResult).toHaveBeenCalledTimes(1);
        expect(reporter.pass).toHaveBeenCalledTimes(1);
    });

    it('rejects with error for a test ID that is not associated with this instance', async () => {
        const reporter = new Reporter('will only log a result for a test ID that is not associated with this instance');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        let actual: any;
        try {
            await aftTest('[C1234] true should be true', async (v: AftTest) => {
                await v.pass('C2345');
            }, { reporter, policyManager });

            expect(true).toBeFalse(); // force failure if we get here
        } catch(e) {
            actual = e;
        }

        expect(policyManager.shouldRun).toHaveBeenCalledTimes(1);
        expect(reporter.submitResult).toHaveBeenCalledTimes(1);
        expect(actual).toMatch('C2345');
    });

    it('calls event handlers in expected order', async () => {
        const eventArray = new Array<string>();
        await new AftTest(rand.getString(15), async (v: AftTest) => {
            await v.verify(true, true);
        }, {
            onEventsMap: new Map<AftTestEvent, Array<Func<AftTest, void | PromiseLike<void>>>>([
                ['started', [() => {eventArray.push('started');}]],
                ['pass', [() => {eventArray.push('pass');}]],
                ['done', [() => {eventArray.push('done');}]]
            ])
        }).run();

        expect(eventArray.length).toBe(3);
        expect(eventArray[0]).toEqual('started');
        expect(eventArray[1]).toEqual('pass');
        expect(eventArray[2]).toEqual('done');
    });
});

const testStore: Map<string, any> = new Map<string, any>();
