import { Reporter, rand, PolicyManager, Verifier, verify, TestResult, LogLevel, ProcessingResult, AftConfig, pluginLoader, containing, equaling } from "../../src";

const consoleLog = console.log;
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
        .internals.withTestIds('C1234','C2345')
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
        .and.withDescription('true [C1234] should be true [C2345]');

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
        .and.withDescription('[C1234][C2345] array contains "bar"');

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
            .withDescription('true should [C1234][C2345] be true');

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
                .and.withDescription('[C1234][C2345] failure expected due to true not being false');

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
        .internals.withTestIds('C1234','C2345');

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
        .internals.withTestIds('C1234','C2345');

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
            return false;
        });
    });

    it('will only log a result for a given test ID one time', async () => {
        const reporter = new Reporter('will only log a result for a given test ID one time');
        spyOn(reporter, 'pass').and.callFake((message: string) => Promise.resolve());
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const peMgr = new PolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await verify(async (v: Verifier) => {
            await v.pass('C1234');
        }).internals.usingReporter(reporter)
        .internals.usingPolicyManager(peMgr)
        .and.withDescription('[C1234] true should be true');

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(1);
        expect(reporter.submitResult).toHaveBeenCalledTimes(1);
        expect(reporter.pass).toHaveBeenCalledTimes(1);
    });

    it('rejects with error for a test ID that is not associated with this instance', async () => {
        const reporter = new Reporter('will only log a result for a test ID that is not associated with this instance');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const peMgr = new PolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        let actual: any;
        try {
            await verify(async (v: Verifier) => {
                await v.pass('C2345');
            }).internals.usingReporter(reporter)
                .internals.usingPolicyManager(peMgr)
                .and.withDescription('[C1234] true should be true');

            expect(true).toBeFalse(); // force failure if we get here
        } catch(e) {
            actual = e;
        }

        expect(peMgr.shouldRun).toHaveBeenCalledTimes(1);
        expect(reporter.submitResult).toHaveBeenCalledTimes(1);
        expect(actual).toContain('test IDs [C2345] do not exist in this Verifier');
    });

    it('calls event handlers in expected order', async () => {
        const eventArray = new Array<string>();
        await verify((v: Verifier) => {
            return true;
        }).returns(true)
        .on('started', () => eventArray.push('started'))
        .on('pass', () => eventArray.push('pass'))
        .on('done', () => eventArray.push('done'));

        expect(eventArray[0]).toEqual('started');
        expect(eventArray[1]).toEqual('pass');
        expect(eventArray[2]).toEqual('done');
    })
});

const testStore: Map<string, any> = new Map<string, any>();
