import { AftConfig } from "aft-core";
import { WebDriver } from "selenium-webdriver";
import { UiSessionGeneratorPlugin } from "../../src";

export class FakeSessionGeneratorPluginThrows extends UiSessionGeneratorPlugin {
    override getSession = async (identifier: string, aftCfg?: AftConfig): Promise<WebDriver> => {
        throw 'fake-exception';
    }
}