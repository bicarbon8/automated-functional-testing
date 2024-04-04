import { rand } from "../helpers/rand";
import { Verifier } from "../verification/verifier";
import { TitleParser } from "./title-parser";

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

    get fullName(): string {
        return this._testName;
    }
}
