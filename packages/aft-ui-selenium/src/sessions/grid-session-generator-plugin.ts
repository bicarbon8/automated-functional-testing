import { Builder, Capabilities, WebDriver } from "selenium-webdriver";
import { UiSessionGeneratorPlugin } from "aft-ui";
import { Err, LogManager } from "aft-core";

type GridSessionOptions = {
    url: string;
    implicitTimeoutMs: number;
    capabilities: Record<string, any>;
}

export class GridSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    private _logMgr: LogManager;
    get logMgr(): LogManager {
        if (!this._logMgr) {
            this._logMgr = new LogManager(this.constructor.name, this.aftCfg);
        }
        return this._logMgr;
    }
    override getSession = async (sessionOptions?: Record<string, any>): Promise<WebDriver> => {
        const gso: GridSessionOptions = {...sessionOptions} as GridSessionOptions;
        const caps: Capabilities = new Capabilities(gso.capabilities);
        let driver: WebDriver;
        if (caps) {
            try {
                driver = await new Builder()
                    .usingServer(gso.url ?? 'http://127.0.0.1:4444/wd/hub')
                    .withCapabilities(caps)
                    .build();
                await Err.handleAsync(async () => await driver.manage().setTimeouts({implicit: gso.implicitTimeoutMs ?? 1000}), {
                    logger: this.logMgr,
                    errLevel: 'debug'
                });
                await Err.handleAsync(async () => await driver.manage().window().maximize(), {
                    logger: this.logMgr,
                    errLevel: 'debug'
                });
            } catch (e) {
                this.logMgr.warn(`error in creating WebDriver due to: ${Err.full(e)}`);
            }
        }
        return driver;
    }
}