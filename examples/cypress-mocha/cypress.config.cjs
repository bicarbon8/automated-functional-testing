const { defineConfig } = require("cypress");

module.exports = defineConfig({
    reporter: '../../../packages/aft-mocha-reporter/dist/src/aft-mocha-reporter.js',
    e2e: {
        specPattern: '**/*.spec.js',
        supportFile: false
    },
})