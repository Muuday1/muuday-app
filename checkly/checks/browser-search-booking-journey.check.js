const { BrowserCheck, Frequency, RetryStrategyBuilder, AlertChannelSubscription } = require('checkly/constructs')
const { prodJourneyGroup, opsEmailAlerts } = require('../check-group')

const browserSearchBookingJourneyCheck = new BrowserCheck('prod-browser-search-booking-journey', {
  name: 'Prod Browser Search Booking Journey',
  group: prodJourneyGroup,
  tags: ['journey:booking', 'type:browser'],
  frequency: Frequency.EVERY_1H,
  locations: ['us-east-1'],
  retryStrategy: RetryStrategyBuilder.noRetries(),
  useGlobalAlertSettings: false,
  code: {
    entrypoint: '../tests/search-booking-journey.spec.js',
  },
})

new AlertChannelSubscription('sub-prod-browser-search-booking-journey-email', {
  alertChannelId: opsEmailAlerts.ref(),
  checkId: browserSearchBookingJourneyCheck.ref(),
  activated: true,
})
