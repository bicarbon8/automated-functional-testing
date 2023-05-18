module.exports = {
    reporters: [
        'default',
        ["<rootDir>/dist/src/aft-jest-reporter.js", { useReporter: true }]
    ]
};