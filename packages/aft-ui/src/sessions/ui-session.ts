import { AftConfig, Class, Reporter, aftConfig, Disposable } from "aft-core";
import { UiComponent, UiComponentOptions } from "../components/ui-component";
import { UiSessionGeneratorManager } from "./ui-session-generator-manager";

export type UiSessionOptions = {
    aftConfig?: AftConfig;
    driver?: unknown;
    reporter?: Reporter;
    additionalSessionOptions?: Record<string, any>;
}

export abstract class UiSession implements Disposable {
    public readonly aftCfg: AftConfig;
    public readonly reporter: Reporter;

    private readonly _addtlOpts: Record<string, any>;

    private _driver: any;
        
    constructor(options?: UiSessionOptions) {
        this.aftCfg = options?.aftConfig ?? aftConfig;
        this.reporter = options?.reporter ?? new Reporter(this.constructor.name, this.aftCfg);
        this._driver = options?.driver;
        this._addtlOpts = options?.additionalSessionOptions ?? {};
    }

    async driver<T extends any>(): Promise<T> {
        if (!this._driver) {
            const sessionGeneratorManager = new UiSessionGeneratorManager(this.aftCfg);
            this._driver = await sessionGeneratorManager.getSession(this._addtlOpts);
        }
        return this._driver as T;
    }

    async getComponent<T extends UiComponent>(componentType: Class<T>, opts?: UiComponentOptions): Promise<T> {
        opts ??= {} as UiComponentOptions;
        opts.aftCfg ??= this.aftCfg;
        opts.driver ??= await this.driver();
        opts.reporter ??= this.reporter;
        return new componentType(opts);
    }

    async dispose(error?: any): Promise<void> {
        if (error) {
            await this.reporter.error(`[${this.constructor.name}]`, error);
        }
    }
}