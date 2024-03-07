import { Plugin } from "../plugin";

export class BuildInfoPlugin extends Plugin {
    buildName = (): Promise<string> => null;
    buildNumber = (): Promise<string> => null;
}
