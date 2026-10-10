import { describe, expect, it } from 'vitest'
import { VoiceAllocator } from './voiceAllocator'

describe('voice allocator', () => {
  it('keeps the pool bounded and steals the oldest active voice deterministically', () => {
    const allocator = new VoiceAllocator(2)
    const first = allocator.allocate(60, 1)
    allocator.allocate(64, 2)
    const replacement = allocator.allocate(67, 3)

    expect(replacement.stolen).toEqual(first.lease)
    expect(replacement.lease.slot).toBe(first.lease.slot)
    expect(allocator.activeCount).toBe(2)
  })

  it('reuses released voices before stealing held notes and accepts repeated notes', () => {
    const allocator = new VoiceAllocator(2)
    allocator.allocate(60, 1)
    const second = allocator.allocate(60, 2)
    expect(allocator.release(60)?.id).toBe(second.lease.id)
    const replacement = allocator.allocate(65, 3)

    expect(replacement.stolen?.id).toBe(second.lease.id)
    expect(replacement.stolen?.released).toBe(true)
    expect(allocator.release(60)?.note).toBe(60)
  })

  it('releases all notes and only completes the lease still owning a slot', () => {
    const allocator = new VoiceAllocator(2)
    const first = allocator.allocate(60, 1)
    allocator.allocate(64, 2)
    const released = allocator.releaseAll()

    expect(released).toHaveLength(2)
    expect(released.every((lease) => lease.released)).toBe(true)
    const replacement = allocator.allocate(67, 3)
    expect(allocator.complete(first.lease.id)).toBe(false)
    expect(allocator.complete(replacement.lease.id)).toBe(true)
    expect(allocator.activeCount).toBe(1)
  })

  it('rejects invalid capacity and MIDI notes', () => {
    expect(() => new VoiceAllocator(0)).toThrow(RangeError)
    const allocator = new VoiceAllocator()
    expect(() => allocator.allocate(128, 0)).toThrow(RangeError)
  })
})
