const { CheckGroupV2 } = require('checkly/constructs')

const prodJourneyGroup = new CheckGroupV2('muuday-prod-journeys-group', {
  name: 'Muuday Prod Journeys',
  tags: ['env:prod', 'app:muuday', 'surface:web'],
})

module.exports = { prodJourneyGroup }

