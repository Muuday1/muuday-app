const { BrowserCheck, Frequency, RetryStrategyBuilder } = require('checkly/constructs')
const { prodJourneyGroup } = require('../check-group')

new BrowserCheck('prod-browser-agenda-journey', {
  name: 'Prod Browser Agenda Journey',
  group: prodJourneyGroup,
  tags: ['journey:agenda', 'type:browser'],
  frequency: Frequency.EVERY_15M,
  locations: ['us-east-1', 'eu-west-1'],
  retryStrategy: RetryStrategyBuilder.fixedStrategy({
    maxRetries: 1,
    baseBackoffSeconds: 30,
    sameRegion: true,
  }),
  code: {
    entrypoint: '../tests/agenda-journey.spec.js',
  },
})
