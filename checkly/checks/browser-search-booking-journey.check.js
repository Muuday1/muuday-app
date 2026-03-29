const { BrowserCheck, Frequency, RetryStrategyBuilder } = require('checkly/constructs')
const { prodJourneyGroup } = require('../check-group')

new BrowserCheck('prod-browser-search-booking-journey', {
  name: 'Prod Browser Search Booking Journey',
  group: prodJourneyGroup,
  tags: ['journey:booking', 'type:browser'],
  frequency: Frequency.EVERY_15M,
  locations: ['us-east-1', 'eu-west-1'],
  retryStrategy: RetryStrategyBuilder.fixedStrategy({
    maxRetries: 1,
    baseBackoffSeconds: 30,
    sameRegion: true,
  }),
  code: {
    entrypoint: '../tests/search-booking-journey.spec.js',
  },
})
