import { Builder, Capabilities, WebDriver } from "selenium-webdriver";
import { UiSessionGeneratorPlugin } from "./ui-session-generator-plugin";
import { AftConfig, Err, JsonObject, LogManager } from "aft-core";
import { UiSessionConfig } from "./ui-session-generator-manager";
import { UiPlatform } from "../configuration/ui-platform";

export class SeleniumGridConfig {
    uiplatform: UiPlatform;
    url: string = 'http://127.0.0.1:4444/wd/hub';
    implicitTimeoutMs: number = 1000;
    additionalCapabilities: JsonObject = {};
}

export class SeleniumGridSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
    }
    
    override getSession = async (aftCfg?: AftConfig, logMgr?: LogManager): Promise<WebDriver> => {
        aftCfg ??= this.aftCfg;
        const caps: Capabilities = await this.generateCapabilities(aftCfg);
        const driver = await this.createDriver(aftCfg, logMgr, caps);
        return driver;
    }
    async generateCapabilities(aftCfg?: AftConfig): Promise<Capabilities> {
        aftCfg ??= this.aftCfg;
        const uic = aftCfg.getSection(UiSessionConfig);
        const sgc = aftCfg.getSection(SeleniumGridConfig);
        let capabilities: Capabilities = new Capabilities();
        const platform: UiPlatform = sgc.uiplatform;
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
        const optCaps: Capabilities = new Capabilities(sgc.additionalCapabilities);
        capabilities = capabilities.merge(optCaps);
        return capabilities;
    }
    /**
     * expected to be called from within `BrowserSessionGeneratorPlugin` implementations
     * after configuring their own `Capabilties` within their `newUiSession` function
     * @param capabilities capabilities to pass to the Remote WebDriver Builder
     * @returns a new `WebDriver` instance
     */
    protected async createDriver(aftCfg: AftConfig, logMgr: LogManager, capabilities: Capabilities): Promise<WebDriver> {
        aftCfg ??= this.aftCfg;
        const logger = logMgr ?? new LogManager(this.constructor.name, aftCfg);
        const cfg = aftCfg.getSection(SeleniumGridConfig);
        if (capabilities) {
            try {
                const driver: WebDriver = await new Builder()
                    .usingServer(cfg.url)
                    .withCapabilities(capabilities)
                    .build();
                await Err.handle(() => driver.manage().setTimeouts({implicit: cfg.implicitTimeoutMs}), {
                    logger: logger,
                    errLevel: 'debug'
                });
                await Err.handle(() => driver.manage().window().maximize(), {
                    logger: logger,
                    errLevel: 'debug'
                });
                return driver;
            } catch (e) {
                logger.warn(`error in creating WebDriver due to: ${Err.full(e)}`);
            }
        }
        return null;
    }
}