import { DefectPluginManager, DefectStatus, IDefect, LoggingPluginManager, ProcessingResult, rand, TestCasePluginManager, Verifier, verify } from "../../src";

describe('Verifier', () => {
    beforeEach(() => {
        testStore.clear();
    });

    it('uses \'description\' as logMgr name if provided', async () => {
        let description: string = rand.getString(22);
        await verify(async (logMgr: LoggingPluginManager) => {
            expect(await logMgr.logName()).toEqual(description);
        })
        .withDescription(description);
    });

    it('uses \'test case IDs\' as logMgr name if no description provided', async () => {
        let tcMgr = new TestCasePluginManager();
        spyOn(tcMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult> => {
            return Promise.resolve({success: true});
        });
        let dMgr = new DefectPluginManager();
        spyOn(dMgr, 'findDefects').and.callFake((searchTerm: string): Promise<IDefect[]> => {
            return Promise.resolve([]);
        });
        spyOn(dMgr, 'getDefect').and.callFake((defectId: string): Promise<IDefect> => {
            return Promise.resolve(null);
        });

        await verify(async (logMgr: LoggingPluginManager) => {
            expect(await logMgr.logName()).toEqual('C1234_C2345');
        })
        .withTests('C1234', 'C2345')
        .and.withTestCasePluginManager(tcMgr)
        .and.withDefectPluginManager(dMgr);
    });
    
    it('can execute a passing expectation', async () => {
        let logMgr: LoggingPluginManager = new LoggingPluginManager();
        spyOn(logMgr, 'logResult').and.callThrough();
        spyOn(logMgr, 'pass').and.callThrough();
        let tcMgr = new TestCasePluginManager();
        spyOn(tcMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult> => {
            return Promise.resolve({success: true});
        });
        let dMgr = new DefectPluginManager();
        spyOn(dMgr, 'findDefects').and.callFake((searchTerm: string): Promise<IDefect[]> => {
            return Promise.resolve([]);
        });
        spyOn(dMgr, 'getDefect').and.callFake((defectId: string): Promise<IDefect> => {
            return Promise.resolve(null);
        });

        await verify((logMgr: LoggingPluginManager) => {
            logMgr.debug(rand.getString(15));
        })
        .withLoggingPluginManager(logMgr)
        .and.withTestCasePluginManager(tcMgr)
        .and.withDefectPluginManager(dMgr)
        .and.withDescription('true should be true')
        .and.withTests('C1234', 'C2345');

        expect(tcMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(dMgr.findDefects).toHaveBeenCalledTimes(2);
        expect(logMgr.logResult).toHaveBeenCalledTimes(2);
        expect(logMgr.pass).toHaveBeenCalledTimes(2);
    });

    it('throws on exception in assertion', async () => {
        let logMgr: LoggingPluginManager = new LoggingPluginManager();
        spyOn(logMgr, 'logResult').and.callThrough();
        spyOn(logMgr, 'fail').and.callThrough();
        let tcMgr = new TestCasePluginManager();
        spyOn(tcMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult> => {
            return Promise.resolve({success: true});
        });
        let dMgr = new DefectPluginManager();
        spyOn(dMgr, 'findDefects').and.callFake((searchTerm: string): Promise<IDefect[]> => {
            return Promise.resolve([]);
        });
        spyOn(dMgr, 'getDefect').and.callFake((defectId: string): Promise<IDefect> => {
            return Promise.resolve(null);
        });

        try {
            await verify(() => {
                throw new Error('fake error');
            })
            .withLoggingPluginManager(logMgr)
            .withTestCasePluginManager(tcMgr)
            .withDefectPluginManager(dMgr)
            .withDescription('true should be true')
            .and.withTests('C1234', 'C2345');

            expect(true).toBe(false); // force failure
        } catch (e) {
            expect(e.toString()).toEqual('Error: fake error');
        }

        expect(tcMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(dMgr.findDefects).toHaveBeenCalledTimes(2);
        expect(logMgr.logResult).toHaveBeenCalledTimes(2);
        expect(logMgr.fail).toHaveBeenCalledTimes(2);
    });

    it('throws on failed comparison with expected result', async () => {
        let logMgr: LoggingPluginManager = new LoggingPluginManager();
        spyOn(logMgr, 'logResult').and.callThrough();
        spyOn(logMgr, 'fail').and.callThrough();
        let tcMgr = new TestCasePluginManager();
        spyOn(tcMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult> => {
            return Promise.resolve({success: true});
        });
        let dMgr = new DefectPluginManager();
        spyOn(dMgr, 'findDefects').and.callFake((searchTerm: string): Promise<IDefect[]> => {
            return Promise.resolve([]);
        });
        spyOn(dMgr, 'getDefect').and.callFake((defectId: string): Promise<IDefect> => {
            return Promise.resolve(null);
        });

        try {
            await verify(() => true)
            .returns(false)
            .and.withLoggingPluginManager(logMgr)
            .and.withTestCasePluginManager(tcMgr)
            .and.withDefectPluginManager(dMgr)
            .and.withDescription('failure expected due to true not being false')
            .and.withTests('C1234', 'C2345');

            expect('foo').toBe('bar'); // force failure
        } catch (e) {
            expect(e.toString()).toEqual(`expected result of 'false' to equal actual result of 'true'`);
        }

        expect(tcMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(dMgr.findDefects).toHaveBeenCalledTimes(2);
        expect(logMgr.logResult).toHaveBeenCalledTimes(2);
        expect(logMgr.fail).toHaveBeenCalledTimes(2);
    });

    it('will not execute expectation if test case manager says should not run for all cases', async () => {
        let logMgr: LoggingPluginManager = new LoggingPluginManager();
        spyOn(logMgr, 'logResult').and.callThrough();
        spyOn(logMgr, 'warn').and.callThrough();
        let tcMgr = new TestCasePluginManager();
        spyOn(tcMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult> => {
            return Promise.resolve({success: false, message: 'test already has result'});
        });
        let dMgr = new DefectPluginManager();
        spyOn(dMgr, 'findDefects').and.callFake((searchTerm: string): Promise<IDefect[]> => {
            return Promise.resolve([]);
        });
        spyOn(dMgr, 'getDefect').and.callFake((defectId: string): Promise<IDefect> => {
            return Promise.resolve(null);
        });

        await verify(() => {
            testStore.set('executed', true);
        })
        .withLoggingPluginManager(logMgr)
        .and.withTestCasePluginManager(tcMgr)
        .and.withDefectPluginManager(dMgr)
        .and.withTests('C1234', 'C2345');

        expect(tcMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(dMgr.findDefects).not.toHaveBeenCalled();
        expect(testStore.has('executed')).toBeFalse();
        expect(logMgr.logResult).toHaveBeenCalledTimes(2);
        expect(logMgr.warn).toHaveBeenCalledTimes(2);
    });

    it('will execute expectation if test case manager says any cases should be run', async () => {
        let logMgr: LoggingPluginManager = new LoggingPluginManager();
        spyOn(logMgr, 'logResult').and.callThrough();
        spyOn(logMgr, 'pass').and.callThrough();
        let tcMgr = new TestCasePluginManager();
        spyOn(tcMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult> => {
            if (testId == 'C1234') {
                return Promise.resolve({success: false, message: 'test already has result'});
            } else {
                return Promise.resolve({success: true});
            }
        });
        let dMgr = new DefectPluginManager();
        spyOn(dMgr, 'findDefects').and.callFake((searchTerm: string): Promise<IDefect[]> => {
            return Promise.resolve([]);
        });
        spyOn(dMgr, 'getDefect').and.callFake((defectId: string): Promise<IDefect> => {
            return Promise.resolve(null);
        });

        await verify(() => {
            testStore.set('executed', true);
        })
        .withLoggingPluginManager(logMgr)
        .and.withTestCasePluginManager(tcMgr)
        .and.withDefectPluginManager(dMgr)
        .and.withTests('C1234', 'C2345');

        expect(tcMgr.shouldRun).toHaveBeenCalledWith('C1234');
        expect(tcMgr.shouldRun).toHaveBeenCalledWith('C2345');
        expect(dMgr.findDefects).toHaveBeenCalledTimes(1);
        expect(testStore.has('executed')).toBeTrue();
        expect(logMgr.logResult).toHaveBeenCalledTimes(2);
        expect(logMgr.pass).toHaveBeenCalledTimes(2);
    });

    it('will not execute expectation if defect manager finds open defect referencing test id', async () => {
        let logMgr: LoggingPluginManager = new LoggingPluginManager();
        spyOn(logMgr, 'logResult').and.callThrough();
        spyOn(logMgr, 'warn').and.callThrough();
        let tcMgr = new TestCasePluginManager();
        spyOn(tcMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult> => {
            return Promise.resolve({success: true});
        });
        let dMgr = new DefectPluginManager();
        spyOn(dMgr, 'findDefects').and.callFake((searchTerm: string): Promise<IDefect[]> => {
            return Promise.resolve([{
                id: 'DEFECT-123',
                title: '[C1234] problem with feature functionality',
                status: DefectStatus.open
            } as IDefect]);
        });
        spyOn(dMgr, 'getDefect').and.callFake((defectId: string): Promise<IDefect> => {
            return Promise.resolve(null);
        });

        await verify(() => {
            testStore.set('executed', true);
        })
        .withLoggingPluginManager(logMgr)
        .and.withTestCasePluginManager(tcMgr)
        .and.withDefectPluginManager(dMgr)
        .and.withTests('C1234');

        expect(tcMgr.shouldRun).toHaveBeenCalledTimes(1);
        expect(dMgr.findDefects).toHaveBeenCalledTimes(1);
        expect(testStore.has('executed')).toBeFalse();
        expect(logMgr.logResult).toHaveBeenCalledTimes(1);
        expect(logMgr.warn).toHaveBeenCalledTimes(1);
    });

    it('will not execute expectation if any referenced defect is open', async () => {
        let logMgr: LoggingPluginManager = new LoggingPluginManager();
        spyOn(logMgr, 'logResult').and.callThrough();
        spyOn(logMgr, 'warn').and.callThrough();
        let tcMgr = new TestCasePluginManager();
        spyOn(tcMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult> => {
            return Promise.resolve({success: true});
        });
        let dMgr = new DefectPluginManager();
        spyOn(dMgr, 'findDefects').and.callFake((searchTerm: string): Promise<IDefect[]> => {
            return Promise.resolve([]);
        });
        spyOn(dMgr, 'getDefect').and.callFake((defectId: string): Promise<IDefect> => {
            if (defectId == 'DEFECT-123') {
                return Promise.resolve({
                    id: defectId,
                    status: DefectStatus.closed
                });
            } else {
                return Promise.resolve({
                    id: defectId,
                    status: DefectStatus.open
                })
            }
        });

        await verify(() => {
            testStore.set('executed', true);
        })
        .withLoggingPluginManager(logMgr)
        .and.withTestCasePluginManager(tcMgr)
        .and.withDefectPluginManager(dMgr)
        .and.withTests('C1234')
        .and.withDefects('DEFECT-123', 'DEFECT-234');

        expect(tcMgr.shouldRun).toHaveBeenCalledTimes(1);
        expect(dMgr.findDefects).toHaveBeenCalledTimes(1);
        expect(dMgr.getDefect).toHaveBeenCalledTimes(2);
        expect(testStore.has('executed')).toBeFalse();
        expect(logMgr.logResult).toHaveBeenCalledTimes(1);
        expect(logMgr.warn).toHaveBeenCalledTimes(1);
    });

    it('will execute expectation if all defects are closed', async () => {
        let logMgr: LoggingPluginManager = new LoggingPluginManager();
        spyOn(logMgr, 'logResult').and.callThrough();
        spyOn(logMgr, 'pass').and.callThrough();
        let tcMgr = new TestCasePluginManager();
        spyOn(tcMgr, 'shouldRun').and.callFake((testId: string): Promise<ProcessingResult> => {
            return Promise.resolve({success: true});
        });
        let dMgr = new DefectPluginManager();
        spyOn(dMgr, 'findDefects').and.callFake((searchTerm: string): Promise<IDefect[]> => {
            return Promise.resolve([]);
        });
        spyOn(dMgr, 'getDefect').and.callFake((defectId: string): Promise<IDefect> => {
            return Promise.resolve({
                id: defectId,
                status: DefectStatus.closed
            });
        });

        await verify(() => {
            testStore.set('executed', true);
        })
        .withLoggingPluginManager(logMgr)
        .and.withTestCasePluginManager(tcMgr)
        .and.withDefectPluginManager(dMgr)
        .and.withDefects('DEFECT-123', 'DEFECT-234');

        expect(tcMgr.shouldRun).not.toHaveBeenCalled();
        expect(dMgr.findDefects).not.toHaveBeenCalled();
        expect(dMgr.getDefect).toHaveBeenCalledWith('DEFECT-123');
        expect(dMgr.getDefect).toHaveBeenCalledWith('DEFECT-234');
        expect(testStore.has('executed')).toBeTrue();
        expect(logMgr.logResult).toHaveBeenCalledTimes(1);
        expect(logMgr.pass).toHaveBeenCalledTimes(1);
    });
});

const testStore: Map<string, any> = new Map<string, any>();