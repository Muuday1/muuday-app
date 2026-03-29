const { ApiCheck, AssertionBuilder, Frequency, RetryStrategyBuilder, AlertChannelSubscription } = require('checkly/constructs')
const { prodJourneyGroup, opsEmailAlerts } = require('../check-group')

const bookingTimeoutsCheck = new ApiCheck('prod-cron-booking-timeouts', {
  name: 'Prod Cron Booking Timeouts',
  group: prodJourneyGroup,
  tags: ['journey:ops', 'type:api', 'cron:booking-timeouts'],
  frequency: Frequency.EVERY_30M,
  locations: ['us-east-1'],
  retryStrategy: RetryStrategyBuilder.singleRetry({
    baseBackoffSeconds: 30,
    sameRegion: true,
  }),
  useGlobalAlertSettings: false,
  request: {
    url: '{{BASE_URL}}/api/cron/booking-timeouts',
    method: 'GET',
    headers: [{ key: 'Authorization', value: 'Bearer {{CRON_SECRET}}' }],
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.textBody().contains('"ok":true'),
    ],
  },
})

new AlertChannelSubscription('sub-prod-cron-booking-timeouts-email', {
  alertChannelId: opsEmailAlerts.ref(),
  checkId: bookingTimeoutsCheck.ref(),
  activated: true,
})
