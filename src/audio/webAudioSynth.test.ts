import { describe, expect, it, vi } from 'vitest'
import { webSynthDefaultValues } from '../model/webSynthProfile'
import { WebAudioSynth } from './webAudioSynth'

function createAudioParam() {
  const setValueAtTime = vi.fn((value: number, ...timing: number[]) => { void timing; audioParam.value = value })
  const linearRampToValueAtTime = vi.fn((value: number, ...timing: number[]) => { void timing; audioParam.value = value })
  const setTargetAtTime = vi.fn((value: number, ...timing: number[]) => { void timing; audioParam.value = value })
  const audioParam = {
    value: 0,
    cancelScheduledValues: vi.fn(),
    cancelAndHoldAtTime: vi.fn(),
    setValueAtTime,
    linearRampToValueAtTime,
    setTargetAtTime,
  }
  return { audioParam: audioParam as unknown as AudioParam, linearRampToValueAtTime }
}

function createAudioContext() {
  let state: AudioContextState = 'suspended'
  const modulationConnections = new Set<unknown>()
  const oscillators: Array<{
    frequency: AudioParam
    detune: AudioParam
    type: OscillatorType
    onended: ((event: Event) => void) | null
    start: ReturnType<typeof vi.fn>
    stop: ReturnType<typeof vi.fn>
    connect: ReturnType<typeof vi.fn>
    disconnect: ReturnType<typeof vi.fn>
  }> = []
  const gains: Array<{ gain: ReturnType<typeof createAudioParam> }> = []
  const filters: Array<{ frequency: ReturnType<typeof createAudioParam>; Q: ReturnType<typeof createAudioParam> }> = []
  const context = {
    currentTime: 1,
    get state() { return state },
    destination: { connect: vi.fn(), disconnect: vi.fn() },
    resume: vi.fn(async () => { state = 'running' }),
    close: vi.fn(async () => { state = 'closed' }),
    createOscillator: vi.fn(() => {
      const isLfo = oscillators.length === 0
      const oscillator = {
        frequency: createAudioParam().audioParam,
        detune: createAudioParam().audioParam,
        type: 'sine' as OscillatorType,
        onended: null as ((event: Event) => void) | null,
        start: vi.fn(),
        stop: vi.fn(() => oscillator.onended?.(new Event('ended'))),
        connect: vi.fn((destination: unknown) => {
          if (isLfo) modulationConnections.add(destination)
        }),
        disconnect: vi.fn((destination?: unknown) => {
          if (!isLfo) return
          if (destination === undefined) modulationConnections.clear()
          else modulationConnections.delete(destination)
        }),
      }
      oscillators.push(oscillator)
      return oscillator
    }),
    createGain: vi.fn(() => {
      const gainParam = createAudioParam()
      const gain = {
        gain: gainParam.audioParam,
        connect: vi.fn(),
        disconnect: vi.fn(),
      }
      gains.push({ gain: gainParam })
      return gain
    }),
    createBiquadFilter: vi.fn(() => {
      const frequency = createAudioParam()
      const Q = createAudioParam()
      const filter = {
        type: 'lowpass' as BiquadFilterType,
        frequency: frequency.audioParam,
        Q: Q.audioParam,
        connect: vi.fn(),
        disconnect: vi.fn(),
      }
      filters.push({ frequency, Q })
      return filter
    }),
  } as unknown as AudioContext
  return { context, oscillators, gains, filters, modulationConnections }
}

describe('Web Audio synth', () => {
  it('waits for explicit start, creates one shared LFO, and bounds voices to eight', async () => {
    const { context, oscillators } = createAudioContext()
    const synth = new WebAudioSynth(() => context)
    expect(synth.getSnapshot()).toEqual({ status: 'idle', error: null })
    expect(context.createOscillator).not.toHaveBeenCalled()
    expect(await synth.start()).toBe(true)
    expect(synth.getSnapshot()).toEqual({ status: 'ready', error: null })
    expect(context.createOscillator).toHaveBeenCalledTimes(1)

    for (let note = 60; note < 68; note += 1) synth.noteOn(note)
    expect(synth.activeVoiceCount).toBe(8)
    expect(synth.noteOn(72)).toBe(true)
    expect(synth.activeVoiceCount).toBe(8)
    expect(oscillators.filter((oscillator) => oscillator.start.mock.calls.length > 0)).toHaveLength(19)
  })

  it('schedules release for note-off and a short release for panic', async () => {
    const { context, oscillators, gains, filters } = createAudioContext()
    const synth = new WebAudioSynth(() => context)
    await synth.start()
    synth.setParameters({ ...webSynthDefaultValues, ampRelease: 200, filterRelease: 1000 })
    synth.noteOn(60)
    expect(filters[0].frequency.linearRampToValueAtTime.mock.calls[1][0]).toBe(7260)
    expect(filters[0].frequency.linearRampToValueAtTime.mock.calls[1][1]).toBeCloseTo(1.61)
    expect(synth.noteOff(60)).toBe(true)
    expect(synth.activeVoiceCount).toBe(0)
    expect(gains[2].gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 1.2)
    expect(filters[0].frequency.linearRampToValueAtTime).toHaveBeenLastCalledWith(6000, 2)
    expect(oscillators[1].stop).toHaveBeenLastCalledWith(2.005)

    synth.noteOn(64)
    expect(synth.allNotesOff()).toBe(1)
    expect(synth.activeVoiceCount).toBe(0)
    const noteOscillators = oscillators.slice(1)
    expect(noteOscillators.at(-1)?.stop.mock.calls.at(-1)?.[0]).toBeCloseTo(1.02)
    expect(gains[2].gain.audioParam.cancelAndHoldAtTime).toHaveBeenCalledWith(1)
    expect(filters[0].frequency.audioParam.cancelAndHoldAtTime).toHaveBeenCalledWith(1)
  })

  it('removes retired voice modulation routes from the shared LFO', async () => {
    const { context, modulationConnections } = createAudioContext()
    const synth = new WebAudioSynth(() => context)
    await synth.start()

    synth.noteOn(60)
    synth.noteOn(62)
    synth.noteOn(64)
    expect(modulationConnections.size).toBe(9)

    expect(synth.noteOff(62)).toBe(true)
    expect(modulationConnections.size).toBe(6)
    expect(synth.noteOff(60)).toBe(true)
    expect(modulationConnections.size).toBe(3)
    expect(synth.noteOff(64)).toBe(true)
    expect(modulationConnections.size).toBe(0)

    for (let note = 65; note < 70; note += 1) {
      synth.noteOn(note)
      expect(modulationConnections.size).toBe(3)
      synth.noteOff(note)
      expect(modulationConnections.size).toBe(0)
    }
  })

  it('smooths parameter updates and applies waveform, filter, and shared LFO destinations', async () => {
    const { context, oscillators } = createAudioContext()
    const synth = new WebAudioSynth(() => context)
    await synth.start()
    synth.noteOn(69)
    const oscillator = oscillators[1]
    const next = { ...webSynthDefaultValues, osc1Wave: 0, osc2Wave: 3, osc1Detune: -20, filterCutoff: 1800, lfoRate: 9, lfoPitchDepth: 30, lfoFilterDepth: 10 }

    synth.setParameters(next)

    expect(oscillator.type).toBe('sine')
    expect(oscillators[2].type).toBe('square')
    expect(oscillators[0].frequency.setTargetAtTime).toHaveBeenCalledWith(9, 1, 0.02)
    expect(oscillator.detune.setTargetAtTime).toHaveBeenCalledWith(-20, 1, 0.02)
  })

  it('reports audio initialization failures without claiming readiness', async () => {
    const synth = new WebAudioSynth(() => { throw new Error('Audio unavailable') })

    expect(await synth.start()).toBe(false)
    expect(synth.getSnapshot()).toEqual({ status: 'error', error: 'Audio unavailable' })
  })
})
