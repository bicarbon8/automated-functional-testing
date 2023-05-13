import { Builder, Capabilities, WebDriver } from "selenium-webdriver";
import { UiSessionGeneratorPlugin, UiSessionConfig, UiPlatform } from "aft-ui";
import { AftConfig, Err, LogManager } from "aft-core";

export class GridSessionConfig {
    url: string = 'http://127.0.0.1:4444/wd/hub';
    implicitTimeoutMs: number = 1000;
}

export class GridSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    private readonly _logMgr: LogManager;
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        this._logMgr = new LogManager(this.constructor.name, this.aftCfg);
    }
    override getSession = async (sessionOptions?: Record<string, any>): Promise<WebDriver> => {
        const driver = await this.createDriver(sessionOptions);
        return driver;
    }
    private async createDriver(sessionOptions: Record<string, any>): Promise<WebDriver> {
        const cfg = this.aftCfg.getSection(GridSessionConfig);
        const caps: Capabilities = await this.getCapabilities(sessionOptions);
        if (caps) {
            try {
                const driver: WebDriver = await new Builder()
                    .usingServer(cfg.url)
                    .withCapabilities(caps)
                    .build();
                await Err.handle(() => driver.manage().setTimeouts({implicit: cfg.implicitTimeoutMs}), {
                    logger: this._logMgr,
                    errLevel: 'debug'
                });
                await Err.handle(() => driver.manage().window().maximize(), {
                    logger: this._logMgr,
                    errLevel: 'debug'
                });
                return driver;
            } catch (e) {
                this._logMgr.warn(`error in creating WebDriver due to: ${Err.full(e)}`);
            }
        }
        return null;
    }
    async getCapabilities(sessionOptions?: Record<string, any>): Promise<Capabilities> {
        const uisc = this.aftCfg.getSection(UiSessionConfig);
        const sgc = this.aftCfg.getSection(GridSessionConfig);
        let capabilities: Capabilities = new Capabilities();
        const platform: UiPlatform = uisc.uiplatform;
        let osVersion = '';
        if (platform.osVersion) {
            osVersion = ' ' + platform.osVersion;
        }
        let browserVersion = '';
        if (platform.browserVersion) {
            browserVersion = ' ' + platform.browserVersion;
        }
        capabilities.set('platform', `${platform.os}${osVersion}`); // results in "windows11" or "osx10" type values
        capabilities.set('browserName', `${platform.browser}${browserVersion}`); // results in "chrome113" or "firefox73" type values
        // overwrite the above with passed in capabilities if any
        const optCaps: Capabilities = new Capabilities(sessionOptions);
        capabilities = capabilities.merge(optCaps);
        return capabilities;
    }
}