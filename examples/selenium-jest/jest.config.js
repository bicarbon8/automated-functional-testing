module.exports = {
    testMatch: ["<rootDir>/dist/test/*.spec.js"],
    reporters: [
        'default',
        ["<rootDir>/../../packages/aft-jest-reporter/dist/src/aft-jest-reporter.js", { useReporter: true }]
    ],
    testTimeout: 60000
};