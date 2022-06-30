import { UiSessionGeneratorManager, UiSessionGeneratorManagerOptions } from "aft-ui";
import { BrowserSession, BrowserSessionOptions } from "./browser-session";
import { BrowserSessionGeneratorPlugin } from "./browser-session-generator-plugin";

export type BrowserSessionGeneratorManagerOptions = UiSessionGeneratorManagerOptions

/**
 * responsible for loading in any referenced `BrowserSessionGeneratorPlugin` implementations
 * from the `aftconfig.json` file under the following section:
 * ```json
 * {
 *   "BrowserSessionGeneratorManager": {
 *     "plugins": [{
 *       "name": "browserstack-browser-session-generator-plugin",
 *       "options": {
 *         "uiplatform": "android_11_chrome_99_Google Pixel XL",
 *         "capabilities": {
 *           "key": "value"
 *         }
 *       }
 *     }]
 *   }
 * }
 * ```
 */
export class BrowserSessionGeneratorManager extends UiSessionGeneratorManager<BrowserSessionGeneratorPlugin<any>, BrowserSessionGeneratorManagerOptions> {
    override async newUiSession(options?: BrowserSessionOptions): Promise<BrowserSession<any>> {
        return await this.first()
        .then(f => f.newUiSession(options)
            .catch(async (err) => {
                const l = await this.logMgr();
                await l.warn(`error calling '${f.constructor.name}.newUiSession(...)' due to: ${err}`);
                return null;
            }))
        .catch(async (err) => {
            const l = await this.logMgr();
            await l.warn(`error calling 'plugin.newUiSession(...)' due to: ${err}`);
            return null;
        });
    }
}

/**
 * responsible for loading in any referenced `BrowserSessionGeneratorPlugin` implementations
 * from the `aftconfig.json` file under the following section:
 * ```json
 * {
 *   "BrowserSessionGeneratorManager": {
 *     "uiplatform": "android_11_chrome_99_Google Pixel XL",
 *     "plugins": [{
 *       "name": "browserstack-browser-session-generator-plugin",
 *       "options": {
 *         "capabilities": {
 *           "key": "value"
 *         }
 *       }
 *     }]
 *   }
 * }
 * ```
 */
export const browserSessionGeneratorMgr = new BrowserSessionGeneratorManager();