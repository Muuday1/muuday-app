const { defineConfig } = require('checkly')
const { Frequency } = require('checkly/constructs')

const baseURL =
  process.env.CHECKLY_BASE_URL ||
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://muuday-app.vercel.app'

module.exports = defineConfig({
  projectName: 'Muuday Production Monitoring',
  logicalId: 'muuday-production-monitoring',
  checks: {
    activated: true,
    muted: false,
    frequency: Frequency.EVERY_15M,
    locations: ['us-east-1'],
    tags: ['env:prod', 'app:muuday'],
    checkMatch: 'checkly/checks/**/*.check.js',
    playwrightConfig: {
      use: {
        baseURL,
      },
    },
    browserChecks: {
      frequency: Frequency.EVERY_1H,
      testMatch: 'checkly/tests/**/*.spec.js',
    },
  },
  cli: {
    runLocation: 'us-east-1',
    retries: 1,
  },
})
