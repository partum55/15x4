import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveLectureVideo } from '../src/lib/lecture-video'

test('resolves YouTube watch links to iframe embeds', () => {
  assert.deepEqual(resolveLectureVideo('https://www.youtube.com/watch?v=abc123'), {
    kind: 'iframe',
    src: 'https://www.youtube-nocookie.com/embed/abc123?rel=0',
  })
})

test('resolves direct and stored video files', () => {
  assert.deepEqual(resolveLectureVideo('https://cdn.example.com/lecture.mp4'), {
    kind: 'file',
    src: 'https://cdn.example.com/lecture.mp4',
  })

  assert.deepEqual(resolveLectureVideo('videos/lecture.webm'), {
    kind: 'file',
    src: '/videos/lecture.webm',
  })
})

test('returns null for missing or unsupported video sources', () => {
  assert.equal(resolveLectureVideo(''), null)
  assert.equal(resolveLectureVideo('not-a-video'), null)
})
