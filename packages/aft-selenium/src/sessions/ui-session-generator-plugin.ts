import { AftConfig, Plugin } from "aft-core";
import { WebDriver } from "selenium-webdriver";

export class UiSessionGeneratorPlugin extends Plugin {
    getSession = async (identifier: string, aftCfg?: AftConfig): Promise<WebDriver> => null;
}