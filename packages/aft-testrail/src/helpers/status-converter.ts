import { TestStatus } from 'aft-core';

/**
 * converts to and from the TestRail `status_id` and the
 * AFT `TestStatus` enum
 */
export class StatusConverter {
    toTestRailStatus(status: TestStatus): number {
        switch (status) {
            case TestStatus.Skipped:
                return 9;
            case TestStatus.Untested:
                return 3;
            case TestStatus.Blocked:
                return 2;
            case TestStatus.Passed:
                return 1;
            case TestStatus.Failed:
            case TestStatus.Retest:
            default:
                return 4;
        }
    }

    fromTestRailStatus(trStatus: number): TestStatus {
        switch (trStatus) {
            case 1:
                return TestStatus.Passed;
            case 2:
                return TestStatus.Blocked;
            case 3:
                return TestStatus.Untested;
            case 5:
                return TestStatus.Failed;
            case 4:
            default:
                return TestStatus.Retest;
        }
    }
}

export module StatusConverter {
    export const instance: StatusConverter = new StatusConverter();
}