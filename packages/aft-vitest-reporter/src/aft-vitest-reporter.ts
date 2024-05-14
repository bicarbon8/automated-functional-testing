import * as vt from 'vitest';
import { AftVitestTest } from './aft-vitest-test';
import { AftConfig, Err, FileSystemMap, aftConfig } from 'aft-core';

/**
 * this reporter integrates the Automated Functional Testing (AFT)
 * library into Mocha
 */
export default class AftVitestReporter implements vt.Reporter {
    private _aftCfg: AftConfig;

    withAftCfg(aftCfg?: AftConfig): this {
        this._aftCfg = aftCfg;
        return this;
    }

    get aftCfg(): AftConfig {
        if (!this._aftCfg) {
            this._aftCfg = aftConfig;
        }
        return this._aftCfg;
    }

    onInit(ctx: vt.Vitest): void { // eslint-disable-line no-unused-vars
        FileSystemMap.removeMapFile(AftVitestTest.name, this.aftCfg);
    }

    async onFinished(filesOrTasks: Array<vt.File | vt.Task>): Promise<void> {
        for (const file of filesOrTasks) {
            if (file.type === 'suite') {
                const tasks = file.tasks;
                await this.onFinished(tasks);
            } else if (file.type === 'test') {
                await this._processTaskResults(...filesOrTasks);
            }
        }
    }

    private async _processTaskResults(...tasks: Array<vt.Task>): Promise<void> {
        for (const task of tasks) {
            try {
                const t = new AftVitestTest({task}, null, {aftCfg: this.aftCfg});
                // if we don't already have results for this test
                if (t.results?.length === 0 && task.result.state !== 'run') {
                    // then send task
                    switch (task.result.state) {
                        case 'fail':
                            const errStrings = new Array<string>();
                            for (const err of task.result.errors) {
                                const errString = Err.handle(() => err.message);
                                if (!errString.message) {
                                    errStrings.push(errString.result);
                                }
                            }
                            await Err.handleAsync(() => t.fail(errStrings.join(',')), {errLevel: 'none'});
                            break;
                        case 'pass':
                            await Err.handleAsync(() => t.pass(), {errLevel: 'none'});
                            break;
                        case 'skip':
                            await Err.handleAsync(() => t.pending(), {errLevel: 'none'});
                            break;
                        default:
                            await t.reporter.warn(`unknown state '${task.result.state}' received`);
                            break;
                    }
                }
            } catch (e) {
                console.log(Err.full(e)); // eslint-disable-line no-undef
            }
        }
    }
}
