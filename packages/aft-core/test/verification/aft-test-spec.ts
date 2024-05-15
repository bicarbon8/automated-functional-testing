import {
    ReportingManager,
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
    AftTestFunction,
    exactly,
    wait
} from "../../src";

const testStore: Map<string, any> = new Map<string, any>();
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
        pluginLoader.reset();
        testStore.clear();
    });

    it('uses "description" as reporter name if provided', async () => {
        const description: string = rand.getString(22);
        await aftTest(description, async (v: AftTest) => {
            await v.verify(v.reporter.name, description);
        });
    });
    
    it('can execute a passing expectation', async () => {
        const reporter = new ReportingManager('');
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'pass').and.callThrough();
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await aftTest('true [C1234] should be true [C2345]', async (v: AftTest) => {
            await v.verify(() => 'foo', 'foo', '[C2345]');
        }, { reporter, policyManager });

        expect(policyManager.shouldRun).toHaveBeenCalledTimes(2);
        expect(reporter.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.pass).toHaveBeenCalledTimes(2);
    });

    it('accepts a VerifyMatcher in the verify function', async () => {
        const reporter = new ReportingManager('');
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'pass').and.callThrough();
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await aftTest('[C1234][C2345] array contains "bar"', async (v: AftTest) => {
            await v.verify(['foo', 'bar', 'baz'], containing('bar'), '[C1234]');
        }, { reporter, policyManager });

        expect(policyManager.shouldRun).toHaveBeenCalledTimes(2);
        expect(reporter.submitResult).toHaveBeenCalledTimes(2);
        expect(reporter.pass).toHaveBeenCalledTimes(2);
    });

    it('throws on exception in testFunction', async () => {
        const reporter = new ReportingManager('');
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

    it('throws on failed comparison with expected in verify function', async () => {
        const reporter = new ReportingManager('');
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

    it('will not execute testFunction if PolicyManager says should not run for all cases', async () => {
        const reporter = new ReportingManager('');
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

    it('will execute testFunction if PolicyManager says any cases should be run', async () => {
        const reporter = new ReportingManager('');
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

    it('will not execute testFunction if no associated testIds and PolicyManager has enabled plugins', async () => {
        const reporter = new ReportingManager('');
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
        const reporter = new ReportingManager('');
        spyOn(reporter, 'pass').and.callFake((message: string) => Promise.resolve());
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await aftTest('[C1234] true should be true', async (v: AftTest) => {
            await v.pass();
        }, { reporter, policyManager });

        expect(policyManager.shouldRun).toHaveBeenCalledTimes(1);
        expect(reporter.submitResult).toHaveBeenCalledTimes(1);
        expect(reporter.pass).toHaveBeenCalledTimes(1);
    });

    it('rejects with error for a test ID that is not associated with this instance', async () => {
        const reporter = new ReportingManager('');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        let actual: any;
        try {
            await aftTest('[C1234] true should be true', async (v: AftTest) => {
                await v.verify(true, true, '[C2345]');
            }, { reporter, policyManager });

            expect(true).toBeFalse(); // force failure if we get here
        } catch(e) {
            actual = e;
        }

        expect(policyManager.shouldRun).toHaveBeenCalledTimes(1);
        expect(reporter.submitResult).toHaveBeenCalledTimes(1);
        expect(actual).toMatch('C2345');
    });

    it('can submit test result for test ID that is not associated with this instance by overriding config', async () => {
        const reporter = new ReportingManager('');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await aftTest('[C1234] true should be true', async (v: AftTest) => {
            await v.verify(true, true, '[C2345]');
        }, {
            reporter,
            policyManager,
            aftCfg: new AftConfig({
                AftTestConfig: {
                    allowAnyTestId: true
                }
            })
        });

        expect(policyManager.shouldRun).toHaveBeenCalledTimes(1);
        expect(reporter.submitResult).toHaveBeenCalledTimes(2);
    });

    it('can submit test result for test ID that is not associated with this instance by overriding options', async () => {
        const reporter = new ReportingManager('');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await aftTest('[C1234] true should be true', async (v: AftTest) => {
            await v.verify(true, true, '[C2345]');
        }, {
            reporter,
            policyManager,
            allowAnyTestId: true
        });

        expect(policyManager.shouldRun).toHaveBeenCalledTimes(1);
        expect(reporter.submitResult).toHaveBeenCalledTimes(2);
    });

    it('calls event handlers in expected order', async () => {
        const eventArray = new Array<string>();
        const t = new AftTest(rand.getString(15), async (v: AftTest) => {
            await v.pass();
        }, {
            aftCfg: new AftConfig({plugins: []}),
            onEventsMap: new Map<AftTestEvent, Array<AftTestFunction>>([
                ['started', [() => {eventArray.push('started');}]],
                ['pass', [() => {eventArray.push('pass');}]],
                ['fail', [() => {eventArray.push('fail');}]],
                ['skipped', [() => {eventArray.push('skipped');}]],
                ['done', [() => {eventArray.push('done');}]]
            ])
        });
        await t.run();

        expect(t.status).toEqual('passed');
        expect(eventArray.length).toBe(3);
        expect(eventArray[0]).toEqual('started');
        expect(eventArray[1]).toEqual('pass');
        expect(eventArray[2]).toEqual('done');
    });

    it('allows including additional metadata in test results via config', async () => {
        const reporter = new ReportingManager('');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        let sentResult: TestResult;
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => {
            sentResult = result;
            return Promise.resolve();
        });
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await aftTest('[C1234] true should be true', async (v: AftTest) => {
            await v.pass();
        }, {
            reporter,
            policyManager,
            aftCfg: new AftConfig({
                AftTestConfig: {
                    additionalMetadata: {
                        fake: rand.getString(14)
                    }
                }
            })
        });

        expect(reporter.submitResult).toHaveBeenCalledTimes(1);
        expect(sentResult.metadata['fake']).toBeDefined();
        expect(sentResult.metadata['fake'].length).toBe(14);
    });

    it('allows including additional metadata in test results via options', async () => {
        const reporter = new ReportingManager('');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        let sentResult: TestResult;
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => {
            sentResult = result;
            return Promise.resolve();
        });
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });

        await aftTest('[C1234] true should be true', async (v: AftTest) => {
            await v.pass();
        }, {
            reporter,
            policyManager,
            additionalMetadata: {
                fake: rand.getString(14)
            }
        });

        expect(reporter.submitResult).toHaveBeenCalledTimes(1);
        expect(sentResult.metadata['fake']).toBeDefined();
        expect(sentResult.metadata['fake'].length).toBe(14);
    });

    it('allows continuing after failure in verify call via config', async () => {
        const reporter = new ReportingManager('');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });
        let calledFunctionOne = false;
        const functionOne = () => {
            calledFunctionOne = true;
            return false;
        };
        let calledFunctionTwo = false;
        const functionTwo = () => {
            calledFunctionTwo = true;
            return true;
        }

        let exception;
        try {
            await aftTest('[C1234] true should be true', async (v: AftTest) => {
                await v.verify(() => functionOne(), exactly(true));
                await v.verify(() => functionTwo(), exactly(true));
            }, {
                reporter,
                policyManager,
                aftCfg: new AftConfig({
                    AftTestConfig: {
                        haltOnVerifyFailure: false
                    }
                })
            });
            expect(false).toBeTrue(); // force failure if we get here
        } catch (e) {
            exception = e;
        }

        expect(exception).toBeDefined();
        expect(calledFunctionOne).toBeTrue();
        expect(calledFunctionTwo).toBeTrue();
    });

    it('allows continuing after failure in verify call via options', async () => {
        const reporter = new ReportingManager('');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });
        let calledFunctionOne = false;
        const functionOne = () => {
            calledFunctionOne = true;
            return false;
        };
        let calledFunctionTwo = false;
        const functionTwo = () => {
            calledFunctionTwo = true;
            return true;
        }

        let exception;
        try {
            await aftTest('[C1234] true should be true', async (v: AftTest) => {
                await v.verify(() => functionOne(), exactly(true));
                await v.verify(() => functionTwo(), exactly(true));
            }, {
                reporter,
                policyManager,
                haltOnVerifyFailure: false
            });
            expect(false).toBeTrue(); // force failure if we get here
        } catch (e) {
            exception = e;
        }

        expect(exception).toBeDefined();
        expect(calledFunctionOne).toBeTrue();
        expect(calledFunctionTwo).toBeTrue();
    });

    it('submits result for all verify calls with no test id and with no extra result on completion', async () => {
        const reporter = new ReportingManager('');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });
        let calledFunctionOne = false;
        const functionOne = () => {
            calledFunctionOne = true;
            return true;
        };
        let calledFunctionTwo = false;
        const functionTwo = () => {
            calledFunctionTwo = true;
            return true;
        }

        await aftTest('true should be true', async (v: AftTest) => {
            await v.verify(() => functionOne(), exactly(true));
            await v.verify(() => functionTwo(), exactly(true));
        }, {
            reporter,
            policyManager,
            haltOnVerifyFailure: false
        });

        expect(calledFunctionOne).toBeTrue();
        expect(calledFunctionTwo).toBeTrue();
        expect(reporter.submitResult).toHaveBeenCalledTimes(2);
    });

    it('submits result for all verify calls with no test id and with extra result on completion when description contains test id', async () => {
        const reporter = new ReportingManager('');
        spyOn(reporter, 'log').and.callFake((level: LogLevel, message: string) => Promise.resolve());
        spyOn(reporter, 'submitResult').and.callFake((result: TestResult) => Promise.resolve());
        const policyManager = new PolicyManager();
        spyOn(policyManager, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult<boolean>> => {
            return Promise.resolve({result: true});
        });
        let calledFunctionOne = false;
        const functionOne = () => {
            calledFunctionOne = true;
            return true;
        };
        let calledFunctionTwo = false;
        const functionTwo = () => {
            calledFunctionTwo = true;
            return true;
        }

        await aftTest('[C1234] true should be true', async (v: AftTest) => {
            await v.verify(() => functionOne(), exactly(true));
            await v.verify(() => functionTwo(), exactly(true));
        }, {
            reporter,
            policyManager,
            haltOnVerifyFailure: false
        });

        expect(calledFunctionOne).toBeTrue();
        expect(calledFunctionTwo).toBeTrue();
        expect(reporter.submitResult).toHaveBeenCalledTimes(3);
    });

    it('gives a valid number for elapsed time when no testFunction exists', async () => {
        const test = new AftTest(rand.getString(18));

        expect(test.elapsed).toBe(0);
    });

    it('gives a valid number for elapsed time when testFunction exists', async () => {
        const test = new AftTest(rand.getString(18), async () => wait.forDuration(50));

        expect(test.elapsed).toBe(0);

        await test.run();

        expect(test.elapsed).toBeGreaterThanOrEqual(50);
    });
});
