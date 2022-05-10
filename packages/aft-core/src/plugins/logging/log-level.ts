import { ellide, EllipsisLocation } from "../../helpers/ellide";

export class LogLevel {
    name: string;
    value: number;
    logString: string;
    constructor(name: string, value: number) {
        this.name = name;
        this.value = value;
        this.logString = ellide(name.toLocaleUpperCase(), 5, EllipsisLocation.end, '');
        while (this.logString.length < 5) {
            this.logString += ' ';
        }
    }
}

export module LogLevel {
    export var trace = new LogLevel('trace', -1);
    export var debug = new LogLevel('debug', 0);
    export var info = new LogLevel('info', 1);
    export var step = new LogLevel('step', 2);
    export var warn = new LogLevel('warn', 3);
    export var pass = new LogLevel('pass', 4);
    export var fail = new LogLevel('fail', 5);
    export var error = new LogLevel('error', 6);
    export var none = new LogLevel('none', Number.MAX_VALUE);

    export function parse(level: string): LogLevel {
        if (level) {
            switch (level.toLocaleLowerCase()) {
                case 'trace':
                    return LogLevel.trace;
                case 'debug':
                    return LogLevel.debug;
                case 'info':
                    return LogLevel.info;
                case 'step':
                    return LogLevel.step;
                case 'warn':
                    return LogLevel.warn;
                case 'pass':
                    return LogLevel.pass;
                case 'fail':
                    return LogLevel.fail;
                case 'error':
                    return LogLevel.error;
                default:
                    return LogLevel.none;
            }
        }
        return LogLevel.none;
    }
}