import { AftConfig } from "aft-core";
import { Locator, WebDriver, WebElement } from "selenium-webdriver";
import { UiSessionGeneratorPlugin } from "../../src";

export class FakeSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    override getSession = async (identifier: string, aftCfg?: AftConfig): Promise<WebDriver> => {
        return {
            findElement: (l: Locator) => Promise.resolve({} as WebElement)
        } as WebDriver;
    }
}