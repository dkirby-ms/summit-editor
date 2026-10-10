import { describe, expect, it, vi } from 'vitest'
import { getEnvelopeStages, scheduleSmoothedValue } from './envelope'

describe('audio envelope helpers', () => {
  it('schedules positive attack and decay stages with a clamped sustain level', () => {
    expect(getEnvelopeStages(10, 0.8, 100, 250, 60)).toEqual({
      attackEnd: 10.1,
      decayEnd: 10.35,
      sustainLevel: 0.48,
    })
    expect(getEnvelopeStages(0, 1, 0, 0, 120)).toEqual({
      attackEnd: 0.005,
      decayEnd: 0.01,
      sustainLevel: 1,
    })
  })

  it('smooths continuous AudioParam changes rather than assigning abrupt values', () => {
    const param = {
      cancelScheduledValues: vi.fn(),
      setTargetAtTime: vi.fn(),
    } as unknown as AudioParam

    scheduleSmoothedValue(param, 880, 2.5)

    expect(param.cancelScheduledValues).toHaveBeenCalledWith(2.5)
    expect(param.setTargetAtTime).toHaveBeenCalledWith(880, 2.5, 0.02)
  })
})
