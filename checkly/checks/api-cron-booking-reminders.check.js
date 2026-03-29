const { ApiCheck, AssertionBuilder, Frequency, RetryStrategyBuilder, AlertChannelSubscription } = require('checkly/constructs')
const { prodJourneyGroup, opsEmailAlerts } = require('../check-group')

const bookingRemindersCheck = new ApiCheck('prod-cron-booking-reminders', {
  name: 'Prod Cron Booking Reminders',
  group: prodJourneyGroup,
  tags: ['journey:ops', 'type:api', 'cron:booking-reminders'],
  frequency: Frequency.EVERY_15M,
  locations: ['us-east-1'],
  retryStrategy: RetryStrategyBuilder.singleRetry({
    baseBackoffSeconds: 30,
    sameRegion: true,
  }),
  useGlobalAlertSettings: false,
  request: {
    url: '{{BASE_URL}}/api/cron/booking-reminders',
    method: 'GET',
    headers: [{ key: 'Authorization', value: 'Bearer {{CRON_SECRET}}' }],
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.textBody().contains('"ok":true'),
    ],
  },
})

new AlertChannelSubscription('sub-prod-cron-booking-reminders-email', {
  alertChannelId: opsEmailAlerts.ref(),
  checkId: bookingRemindersCheck.ref(),
  activated: true,
})
