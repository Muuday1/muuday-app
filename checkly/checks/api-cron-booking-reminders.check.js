const { ApiCheck, AssertionBuilder, Frequency, RetryStrategyBuilder } = require('checkly/constructs')
const { prodJourneyGroup } = require('../check-group')

new ApiCheck('prod-cron-booking-reminders', {
  name: 'Prod Cron Booking Reminders',
  group: prodJourneyGroup,
  tags: ['journey:ops', 'type:api', 'cron:booking-reminders'],
  frequency: Frequency.EVERY_5M,
  locations: ['us-east-1', 'eu-west-1'],
  retryStrategy: RetryStrategyBuilder.fixedStrategy({
    maxRetries: 2,
    baseBackoffSeconds: 30,
    sameRegion: true,
  }),
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

