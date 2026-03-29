const { ApiCheck, AssertionBuilder, Frequency, RetryStrategyBuilder, AlertChannelSubscription } = require('checkly/constructs')
const { prodJourneyGroup, opsEmailAlerts } = require('../check-group')

const loginAvailabilityCheck = new ApiCheck('prod-login-availability', {
  name: 'Prod Login Availability',
  group: prodJourneyGroup,
  tags: ['journey:auth', 'type:api'],
  frequency: Frequency.EVERY_15M,
  locations: ['us-east-1'],
  retryStrategy: RetryStrategyBuilder.singleRetry({
    baseBackoffSeconds: 30,
    sameRegion: true,
  }),
  useGlobalAlertSettings: false,
  degradedResponseTime: 5000,
  maxResponseTime: 20000,
  request: {
    url: '{{BASE_URL}}/login',
    method: 'GET',
    followRedirects: true,
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.textBody().contains('Muuday'),
    ],
  },
})

new AlertChannelSubscription('sub-prod-login-availability-email', {
  alertChannelId: opsEmailAlerts.ref(),
  checkId: loginAvailabilityCheck.ref(),
  activated: true,
})
