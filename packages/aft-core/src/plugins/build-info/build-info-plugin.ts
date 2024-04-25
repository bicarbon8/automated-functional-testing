import { Plugin } from "../plugin"; // eslint-disable-line no-redeclare

/**
 * a plugin providing build information such as
 * Build Name and Number to help differentiate
 * test results when running in CICD
 */
export class BuildInfoPlugin extends Plugin {
    buildName = (): Promise<string> => null;
    buildNumber = (): Promise<string> => null;
}
