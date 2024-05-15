/**
 * thrown by the `AftTest.pass()` function to
 * halt execution of the `testFunction` indicating
 * a successful test
 */
export class AftTestPassError extends Error { }

/**
 * thrown by the `AftTest.fail(message?)` function
 * to halt execution of the `testFunction` indicating
 * an unsuccessful test
 */
export class AftTestFailError extends Error { }

/**
 * thrown by the `AftTest.pending(message?)` function
 * to halt execution of the `testFunction` indicating
 * the rest of the test should be skipped
 */
export class AftTestPendingError extends Error { }