import * as path from "path";
import { LoggingLevel, rand, TestStatus } from "aft-core";
import { HtmlFileManager, HtmlLoggingPlugin, HtmlResult, HtmlTestResult } from "../src";

describe('HtmlFileManager', () => {
    it('only generates the html file when the logger is disposed of', async () => {
        let outFileName: string = `${rand.getString(15)}.html`;
        let htmlFileMgr: HtmlFileManager = new HtmlFileManager();
        let writeSpy = spyOn<any>(htmlFileMgr, '_writeResults').and.callFake(async (result: HtmlResult, path: string) => {
            /* do nothing */
        });

        let plugin: HtmlLoggingPlugin = new HtmlLoggingPlugin({
            outputDir: './dist',
            fileName: outFileName,
            _htmlFileMgr: htmlFileMgr
        });
        await plugin.onLoad();

        await plugin.log(LoggingLevel.pass, rand.getString(123));
        await plugin.log(LoggingLevel.error, rand.getString(123));
        await plugin.logResult({
            created: new Date(),
            resultId: rand.guid,
            status: TestStatus.Passed
        });

        expect(writeSpy).not.toHaveBeenCalled();

        await plugin.dispose();

        expect(writeSpy).toHaveBeenCalledTimes(1);
    });

    it('performs well under load', async () => {
        let htmlFileMgr: HtmlFileManager = new HtmlFileManager();
        let writeSpy = spyOn<any>(htmlFileMgr, '_writeResults').and.callThrough();
        let outPath: string = path.join(process.cwd(), './dist', `${rand.getString(22)}.html`);
        for (var i=0; i<100; i++) {
            let res: HtmlResult = {
                description: rand.getString(rand.getInt(30, 50)),
                tests: []
            }
            let testCount: number = rand.getInt(1, 5);
            for (var j=0; j<testCount; j++) {
                let t: HtmlTestResult = {
                    testId: rand.getString(5),
                    status: TestStatus[rand.getEnum(TestStatus)],
                    logs: [rand.getString(123), rand.getString(123), rand.getString(123), rand.getString(123), rand.getString(123)]
                }
                res.tests.push(t);
            }
            htmlFileMgr.addResult(res, outPath);
        }
        expect(writeSpy).toHaveBeenCalledTimes(100);
    });
});