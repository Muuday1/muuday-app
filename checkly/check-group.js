const { CheckGroupV2, EmailAlertChannel } = require('checkly/constructs')

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

module.exports = { prodJourneyGroup, opsEmailAlerts }
