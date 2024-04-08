import { rand } from "../helpers/rand";
import { Verifier } from "../verification/verifier";
import { TitleParser } from "./title-parser";

/**
 * base class used to integrate AFT with external test
 * frameworks such as Jasmine, Mocha and Jest. Integrations
 * typically would consist of a new class extending from this
 * one which takes in a test context for the given
 * framework and passes the currently executing test name
 * to AFT via this base class's constructor
 */
export class AftTest extends Verifier {
    private readonly _testName: string;

    constructor(testFullName: string) {
        super();
        this._testName = testFullName ?? `${this.constructor.name}_${rand.getString(8, true, true)}`;
        this.withDescription(this.fullName); // eslint-disable-line
        const tests = TitleParser.parseTestIds(this.fullName);
        if (tests?.length > 0) {
            this.withTestIds(...tests); // eslint-disable-line
        }
    }

    /**
     * the full name of the currently executing test.
     * 
     * ex: `"AftTest [C1234] can provide a valid fullName"`
     * 
     * **NOTE**
     * > this may also include the contents of any
     * encapsulating `describe` functions wrapping the
     * current `it` or `test` function, but implementation
     * may be different for each supported framwork
     */
    get fullName(): string {
        return this._testName;
    }

    override withDescription(description: string): this { // eslint-disable-line no-unused-vars
        // do NOT set since this is set via constructor
        return this;
    }
}
