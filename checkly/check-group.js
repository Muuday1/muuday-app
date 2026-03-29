const { CheckGroupV2, EmailAlertChannel, AlertChannelSubscription } = require('checkly/constructs')

const prodJourneyGroup = new CheckGroupV2('muuday-prod-journeys-group', {
  name: 'Muuday Prod Journeys',
  tags: ['env:prod', 'app:muuday', 'surface:web'],
})

const opsEmailAlerts = new EmailAlertChannel('muuday-ops-email-alerts', {
  address: 'igorpinto.lds@gmail.com',
  sendFailure: true,
  sendRecovery: true,
  sendDegraded: true,
})

new AlertChannelSubscription('muuday-ops-email-alerts-subscription', {
  alertChannelId: opsEmailAlerts.ref(),
  groupId: prodJourneyGroup.ref(),
  activated: true,
})

module.exports = { prodJourneyGroup }
