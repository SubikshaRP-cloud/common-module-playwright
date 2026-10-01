const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({

    testDir: './tests',

    fullyParallel: false,

    workers: 1,

    timeout: 120000,

    expect: {
        timeout: 15000
    },

    reporter: [
        ['html', { open: 'never' }]
    ],

    use: {

        baseURL: 'https://dowellapps.com:8443',

        headless: false,

        actionTimeout: 30000,

        navigationTimeout: 120000,

        screenshot: 'only-on-failure',

        trace: 'on-first-retry',

        ignoreHTTPSErrors: true
    },

    projects: [

        {
            name: 'chromium',

            use: {
                ...devices['Desktop Chrome']
            }
        }

    ]
});