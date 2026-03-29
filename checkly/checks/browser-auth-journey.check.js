const { BrowserCheck, Frequency, RetryStrategyBuilder, AlertChannelSubscription } = require('checkly/constructs')
const { prodJourneyGroup, opsEmailAlerts } = require('../check-group')

const browserAuthJourneyCheck = new BrowserCheck('prod-browser-auth-journey', {
  name: 'Prod Browser Auth Journey',
  group: prodJourneyGroup,
  tags: ['journey:auth', 'type:browser'],
  frequency: Frequency.EVERY_1H,
  locations: ['us-east-1'],
  retryStrategy: RetryStrategyBuilder.noRetries(),
  useGlobalAlertSettings: false,
  code: {
    entrypoint: '../tests/auth-journey.spec.js',
  },
})

new AlertChannelSubscription('sub-prod-browser-auth-journey-email', {
  alertChannelId: opsEmailAlerts.ref(),
  checkId: browserAuthJourneyCheck.ref(),
  activated: true,
})
