import assert from 'node:assert/strict'
import test from 'node:test'
import { getEventPhase, getEventStartTimestamp, isEventPast } from '../src/lib/date-time'

test('keeps events live for one hour after the Kyiv start time', () => {
  const start = getEventStartTimestamp('2026-05-06', '12:00')
  assert.equal(typeof start, 'number')

  assert.equal(getEventPhase('2026-05-06', '12:00', start! - 1), 'upcoming')
  assert.equal(getEventPhase('2026-05-06', '12:00', start! + 30 * 60 * 1000), 'live')
  assert.equal(isEventPast('2026-05-06', '12:00', start! + 60 * 60 * 1000 + 1), true)
})

test('uses end of day when event time is missing', () => {
  const start = getEventStartTimestamp('2026-05-06', null)
  assert.equal(typeof start, 'number')

  assert.equal(isEventPast('2026-05-06', null, start! - 1), false)
  assert.equal(isEventPast('2026-05-06', null, start! + 60 * 60 * 1000 + 1), true)
})
