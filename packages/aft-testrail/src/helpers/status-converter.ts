import { TestStatus } from 'aft-core';

class StatusConverter {
    /**
     * converts from AFT `TestStatus` to TestRail API status number
     * @param status an AFT `TestStatus` enum to be converted
     * @returns a TestRail API status number
     */
    toTestRailStatus(status: TestStatus): number {
        switch (status) {
            case 'Skipped':
                return 9;
            case 'Untested':
                return 3;
            case 'Blocked':
                return 2;
            case 'Passed':
                return 1;
            case 'Failed':
            case 'Retest':
            default:
                return 4;
        }
    }

    /**
     * converts from TestRail API status number to an AFT `TestStatus` enum
     * @param trStatus a TestRail API status number to be converted
     * @returns an AFT `TestStatus` enum
     */
    fromTestRailStatus(trStatus: number): TestStatus {
        switch (trStatus) {
            case 1:
                return 'Passed';
            case 2:
                return 'Blocked';
            case 3:
                return 'Untested';
            case 5:
                return 'Failed';
            case 4:
            default:
                return 'Retest';
        }
    }
}

/**
 * converts to and from the TestRail `status_id` and the
 * AFT `TestStatus` enum
 */
export const statusConverter = new StatusConverter();