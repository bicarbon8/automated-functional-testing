import { AftConfig, LogManager, Plugin } from "aft-core";
import { WebDriver } from "selenium-webdriver";

export class UiSessionGeneratorPlugin extends Plugin {
    getSession = async (aftCfg?: AftConfig, logMgr?: LogManager): Promise<WebDriver> => null;
}