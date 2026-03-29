const { BrowserCheck, Frequency, RetryStrategyBuilder } = require('checkly/constructs')
const { prodJourneyGroup } = require('../check-group')

new BrowserCheck('prod-browser-auth-journey', {
  name: 'Prod Browser Auth Journey',
  group: prodJourneyGroup,
  tags: ['journey:auth', 'type:browser'],
  frequency: Frequency.EVERY_10M,
  locations: ['us-east-1', 'eu-west-1'],
  retryStrategy: RetryStrategyBuilder.fixedStrategy({
    maxRetries: 1,
    baseBackoffSeconds: 30,
    sameRegion: true,
  }),
  code: {
    entrypoint: '../tests/auth-journey.spec.js',
  },
})
