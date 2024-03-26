import { Plugin } from "../plugin"; // eslint-disable-line no-redeclare

export class BuildInfoPlugin extends Plugin {
    buildName = (): Promise<string> => null;
    buildNumber = (): Promise<string> => null;
}
