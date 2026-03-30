#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

function readFile(relativePath) {
  const fullPath = path.join(process.cwd(), relativePath)
  return fs.readFileSync(fullPath, 'utf8')
}

function extractArrayLiteral(source, constantName) {
  const pattern = new RegExp(
    `(?:export\\s+)?const\\s+${constantName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s+as\\s+const`,
  )
  const match = source.match(pattern)
  if (!match) throw new Error(`Could not find array literal for ${constantName}`)
  return Function(`"use strict"; return [${match[1]}]`)()
}

function extractObjectLiteral(source, constantName) {
  const startToken = `const ${constantName}`
  const start = source.indexOf(startToken)
  if (start < 0) throw new Error(`Could not find object constant ${constantName}`)
  const equalsIndex = source.indexOf('=', start)
  if (equalsIndex < 0) throw new Error(`Could not find '=' for ${constantName}`)
  const objectStart = source.indexOf('{', equalsIndex)
  if (objectStart < 0) throw new Error(`Could not find object literal start for ${constantName}`)

  let depth = 0
  let end = -1
  for (let i = objectStart; i < source.length; i += 1) {
    const char = source[i]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  if (end < 0) throw new Error(`Could not find object literal end for ${constantName}`)
  const objectLiteral = source.slice(objectStart, end + 1)
  return Function(`"use strict"; return (${objectLiteral})`)()
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertTransitionMap({ name, statuses, transitions, terminalStatuses, requiredEdges }) {
  const statusSet = new Set(statuses)

  statuses.forEach(status => {
    assert(
      Object.prototype.hasOwnProperty.call(transitions, status),
      `${name}: missing transition key for "${status}"`,
    )
  })

  Object.entries(transitions).forEach(([from, toList]) => {
    assert(statusSet.has(from), `${name}: unknown from-status "${from}"`)
    assert(Array.isArray(toList), `${name}: transition list for "${from}" is not an array`)
    toList.forEach(to => {
      assert(statusSet.has(to), `${name}: unknown to-status "${to}" in "${from}" transitions`)
    })
  })

  terminalStatuses.forEach(status => {
    assert(
      (transitions[status] || []).length === 0,
      `${name}: terminal status "${status}" must not allow outgoing transitions`,
    )
  })

  requiredEdges.forEach(([from, to]) => {
    assert(
      (transitions[from] || []).includes(to),
      `${name}: missing required transition "${from}" -> "${to}"`,
    )
  })
}

function run() {
  const bookingTypesSource = readFile('lib/booking/types.ts')
  const bookingSource = readFile('lib/booking/state-machine.ts')
  const bookingStatuses = extractArrayLiteral(bookingTypesSource, 'BOOKING_STATUSES')
  const bookingTransitions = extractObjectLiteral(bookingSource, 'ALLOWED_TRANSITIONS')

  assertTransitionMap({
    name: 'booking',
    statuses: bookingStatuses,
    transitions: bookingTransitions,
    terminalStatuses: ['cancelled', 'completed'],
    requiredEdges: [
      ['draft', 'pending_payment'],
      ['pending_payment', 'confirmed'],
      ['pending_confirmation', 'confirmed'],
      ['confirmed', 'completed'],
      ['confirmed', 'cancelled'],
      ['confirmed', 'no_show'],
    ],
  })

  const requestSource = readFile('lib/booking/request-booking-state-machine.ts')
  const requestStatuses = extractArrayLiteral(requestSource, 'REQUEST_BOOKING_STATUSES')
  const requestTransitions = extractObjectLiteral(
    requestSource,
    'ALLOWED_REQUEST_BOOKING_TRANSITIONS',
  )

  assertTransitionMap({
    name: 'request_booking',
    statuses: requestStatuses,
    transitions: requestTransitions,
    terminalStatuses: ['declined', 'expired', 'cancelled', 'converted'],
    requiredEdges: [
      ['open', 'offered'],
      ['open', 'cancelled'],
      ['offered', 'accepted'],
      ['offered', 'declined'],
      ['offered', 'converted'],
      ['accepted', 'converted'],
    ],
  })

  console.log('State machine validation passed.')
}

try {
  run()
} catch (error) {
  console.error('State machine validation failed.')
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
