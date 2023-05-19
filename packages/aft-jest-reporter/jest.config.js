module.exports = {
    testMatch: ["<rootDir>/dist/test/*.spec.js"],
    reporters: [
        'default',
        ["<rootDir>/dist/src/aft-jest-reporter.js", { useReporter: true }]
    ]
};