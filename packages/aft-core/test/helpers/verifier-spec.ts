import { DefectPluginManager, IDefect, LoggingPluginManager, ProcessingResult, rand, TestCasePluginManager, Verifier } from "../../src";

describe('Verifier', () => {
    fit('can execute a passing expectation', async () => {
        let v: Verifier = new Verifier();
        let logMgr: LoggingPluginManager = new LoggingPluginManager({logName: rand.guid});
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
        v.init({
            _loggingPluginManager: logMgr,
            _testCasePluginManager: tcMgr,
            _defectPluginManager: dMgr
        });

        await v.expect((ver: Verifier) => {
            ver.logMgr.debug(rand.getString(15));
        }).withDescription('true should be true')
        .and.withTests('C1234', 'C2345').verify();

        expect(tcMgr.shouldRun).toHaveBeenCalledTimes(2);
        expect(dMgr.findDefects).toHaveBeenCalledTimes(2);
    });
});