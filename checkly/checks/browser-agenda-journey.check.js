const { BrowserCheck, Frequency, RetryStrategyBuilder, AlertChannelSubscription } = require('checkly/constructs')
const { prodJourneyGroup, opsEmailAlerts } = require('../check-group')

const browserAgendaJourneyCheck = new BrowserCheck('prod-browser-agenda-journey', {
  name: 'Prod Browser Agenda Journey',
  group: prodJourneyGroup,
  tags: ['journey:agenda', 'type:browser'],
  frequency: Frequency.EVERY_1H,
  locations: ['us-east-1'],
  retryStrategy: RetryStrategyBuilder.noRetries(),
  useGlobalAlertSettings: false,
  code: {
    entrypoint: '../tests/agenda-journey.spec.js',
  },
})

new AlertChannelSubscription('sub-prod-browser-agenda-journey-email', {
  alertChannelId: opsEmailAlerts.ref(),
  checkId: browserAgendaJourneyCheck.ref(),
  activated: true,
})
