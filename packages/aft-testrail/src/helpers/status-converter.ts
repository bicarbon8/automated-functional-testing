import { TestStatus } from 'aft-core';

class StatusConverter {
    /**
     * converts from AFT `TestStatus` to TestRail API status number
     * @param status an AFT `TestStatus` enum to be converted
     * @returns a TestRail API status number
     */
    toTestRailStatus(status: TestStatus): number {
        switch (status) {
            case 'skipped':
                return 9;
            case 'untested':
                return 3;
            case 'blocked':
                return 2;
            case 'passed':
                return 1;
            case 'failed':
            case 'retest':
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
                return 'passed';
            case 2:
                return 'blocked';
            case 3:
                return 'untested';
            case 5:
                return 'failed';
            case 4:
            default:
                return 'retest';
        }
    }
}

/**
 * converts to and from the TestRail `status_id` and the
 * AFT `TestStatus` enum
 */
export const statusConverter = new StatusConverter();