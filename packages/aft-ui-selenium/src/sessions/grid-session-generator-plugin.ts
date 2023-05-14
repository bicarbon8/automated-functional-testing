import { Builder, Capabilities, WebDriver } from "selenium-webdriver";
import { UiSessionGeneratorPlugin } from "aft-ui";
import { AftConfig, Err, LogManager } from "aft-core";

export class GridSessionConfig {
    url: string = 'http://127.0.0.1:4444/wd/hub';
    implicitTimeoutMs: number = 1000;
}

export class GridSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    private _logMgr: LogManager;
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
    }
    get logMgr(): LogManager {
        if (!this._logMgr) {
            this._logMgr = new LogManager(this.constructor.name, this.aftCfg);
        }
        return this._logMgr;
    }
    override getSession = async (sessionOptions?: Record<string, any>): Promise<WebDriver> => {
        const cfg = this.aftCfg.getSection(GridSessionConfig);
        const caps: Capabilities = await this.getCapabilities(sessionOptions);
        if (caps) {
            try {
                const driver: WebDriver = await new Builder()
                    .usingServer(cfg.url)
                    .withCapabilities(caps)
                    .build();
                await Err.handle(() => driver.manage().setTimeouts({implicit: cfg.implicitTimeoutMs}), {
                    logger: this.logMgr,
                    errLevel: 'debug'
                });
                await Err.handle(() => driver.manage().window().maximize(), {
                    logger: this.logMgr,
                    errLevel: 'debug'
                });
                return driver;
            } catch (e) {
                this.logMgr.warn(`error in creating WebDriver due to: ${Err.full(e)}`);
            }
        }
        return null;
    }
    async getCapabilities(sessionOptions?: Record<string, any>): Promise<Capabilities> {
        let capabilities: Capabilities = new Capabilities(sessionOptions);
        return capabilities;
    }
}