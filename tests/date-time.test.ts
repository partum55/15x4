import assert from 'node:assert/strict'
import test from 'node:test'
import { isEventPast } from '../src/lib/date-time'

test('marks events before the current timestamp as past', () => {
  const now = new Date('2026-05-06T12:00:00').getTime()

  assert.equal(isEventPast('2026-05-06', '11:59', now), true)
  assert.equal(isEventPast('2026-05-06', '12:01', now), false)
})

test('uses end of day when event time is missing', () => {
  const noon = new Date('2026-05-06T12:00:00').getTime()
  const nextDay = new Date('2026-05-07T00:00:00').getTime()

  assert.equal(isEventPast('2026-05-06', null, noon), false)
  assert.equal(isEventPast('2026-05-06', null, nextDay), true)
})
