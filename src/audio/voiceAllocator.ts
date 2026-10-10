export type VoiceLease = {
  id: number
  slot: number
  note: number
  startedAt: number
  released: boolean
}

export type VoiceAllocation = {
  lease: VoiceLease
  stolen: VoiceLease | null
}

export class VoiceAllocator {
  private readonly slots: Array<VoiceLease | null>
  private nextId = 1
  readonly capacity: number

  constructor(capacity = 8) {
    this.capacity = capacity
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('Voice capacity must be a positive integer.')
    this.slots = Array.from({ length: capacity }, () => null)
  }

  allocate(note: number, startedAt: number): VoiceAllocation {
    if (!Number.isInteger(note) || note < 0 || note > 127) throw new RangeError('MIDI note must be an integer from 0 to 127.')
    const freeSlot = this.slots.findIndex((lease) => lease === null)
    const slot = freeSlot >= 0 ? freeSlot : this.findVictimSlot()
    const stolen = this.slots[slot]
    const lease: VoiceLease = { id: this.nextId++, slot, note, startedAt, released: false }
    this.slots[slot] = lease
    return { lease, stolen }
  }

  release(note: number): VoiceLease | null {
    const lease = [...this.slots]
      .filter((candidate): candidate is VoiceLease => candidate !== null && candidate.note === note && !candidate.released)
      .sort((left, right) => right.id - left.id)[0]
    if (!lease) return null
    const released = { ...lease, released: true }
    this.slots[lease.slot] = released
    return released
  }

  releaseAll() {
    const released: VoiceLease[] = []
    this.slots.forEach((lease, index) => {
      if (!lease || lease.released) return
      const next = { ...lease, released: true }
      this.slots[index] = next
      released.push(next)
    })
    return released
  }

  complete(id: number) {
    const slot = this.slots.findIndex((lease) => lease?.id === id)
    if (slot < 0) return false
    this.slots[slot] = null
    return true
  }

  get activeCount() {
    return this.slots.filter((lease) => lease !== null).length
  }

  private findVictimSlot() {
    const released = this.slots
      .map((lease, slot) => ({ lease, slot }))
      .filter((candidate): candidate is { lease: VoiceLease; slot: number } => candidate.lease !== null && candidate.lease.released)
      .sort((left, right) => left.lease.startedAt - right.lease.startedAt)[0]
    if (released) return released.slot

    return this.slots.reduce((oldestSlot, lease, slot, slots) => {
      const oldest = slots[oldestSlot]
      return lease && oldest && lease.startedAt < oldest.startedAt ? slot : oldestSlot
    }, 0)
  }
}
