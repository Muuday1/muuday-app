const { ApiCheck, AssertionBuilder, Frequency, RetryStrategyBuilder } = require('checkly/constructs')
const { prodJourneyGroup } = require('../check-group')

new ApiCheck('prod-login-availability', {
  name: 'Prod Login Availability',
  group: prodJourneyGroup,
  tags: ['journey:auth', 'type:api'],
  frequency: Frequency.EVERY_5M,
  locations: ['us-east-1', 'eu-west-1'],
  retryStrategy: RetryStrategyBuilder.fixedStrategy({
    maxRetries: 2,
    baseBackoffSeconds: 30,
    sameRegion: true,
  }),
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

