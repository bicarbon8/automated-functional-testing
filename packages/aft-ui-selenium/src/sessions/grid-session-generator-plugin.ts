import { Builder, Capabilities, WebDriver } from "selenium-webdriver";
import { UiSessionGeneratorPlugin } from "aft-ui";
import { Err, Reporter } from "aft-core";

type GridSessionOptions = {
    url: string;
    implicitTimeoutMs: number;
    capabilities: Record<string, any>;
}

export class GridSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    private _reporter: Reporter;
    get reporter(): Reporter {
        if (!this._reporter) {
            this._reporter = new Reporter(this.constructor.name, this.aftCfg);
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
                await Err.handleAsync(async () => await driver.manage().setTimeouts({implicit: gso.implicitTimeoutMs ?? 1000}), {
                    logger: this.reporter,
                    errLevel: 'debug'
                });
                await Err.handleAsync(async () => await driver.manage().window().maximize(), {
                    logger: this.reporter,
                    errLevel: 'debug'
                });
            } catch (e) {
                await this.reporter.warn(`error in creating WebDriver due to: ${Err.full(e)}`);
            }
        }
        return driver;
    }
}