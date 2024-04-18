import { Builder, Capabilities, WebDriver } from "selenium-webdriver";
import { UiSessionGeneratorPlugin } from "aft-ui";
import { Err, ReportingManager } from "aft-core";

type GridSessionOptions = {
    url: string;
    implicitTimeoutMs: number;
    capabilities: Record<string, any>;
}

export class GridSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    private _reporter: ReportingManager;
    get reporter(): ReportingManager {
        if (!this._reporter) {
            this._reporter = new ReportingManager(this.constructor.name, this.aftCfg);
        }
        return this._reporter;
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
                const handledTime = await Err.handleAsync(() => driver.manage().setTimeouts({implicit: gso.implicitTimeoutMs ?? 1000}));
                if (handledTime.message) {
                    await this.reporter.trace(handledTime.message);
                }
                const handledMax = await Err.handleAsync(() => driver.manage().window().maximize());
                if (handledMax.message) {
                    await this.reporter.trace(handledMax.message);
                }
            } catch (e) {
                await this.reporter.warn(`error in creating WebDriver due to: ${Err.full(e)}`);
            }
        }
        return driver;
    }
}