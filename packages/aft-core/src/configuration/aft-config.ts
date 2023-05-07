import { LogLevel } from "../plugins/logging/log-level";

export class AftConfig {
    pluginsSearchDir: string = process.cwd();
    pluginNames: Array<string> = new Array<string>();
    logLevel: LogLevel = 'warn';
    resultsDirectory: string = 'AftResults';
    cacheDirectory: string = 'AftCache';
}