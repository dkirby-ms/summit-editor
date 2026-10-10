import { getEnvelopeStages, scheduleSmoothedValue } from './envelope'
import { VoiceAllocator } from './voiceAllocator'
import { webSynthDefaultValues, webSynthParameters } from '../model/webSynthProfile'
import type { WebSynthParameterId } from '../model/webSynthProfile'

export type AudioStatus = 'idle' | 'starting' | 'ready' | 'error'

export type AudioSnapshot = {
  status: AudioStatus
  error: string | null
}

type AudioContextFactory = () => AudioContext

type VoiceNodes = {
  leaseId: number
  note: number
  baseFrequency: number
  lfo: OscillatorNode
  oscillator1: OscillatorNode
  oscillator2: OscillatorNode
  filter: BiquadFilterNode
  ampGain: GainNode
  pitchModGain1: GainNode
  pitchModGain2: GainNode
  filterModGain: GainNode
  stoppedSources: number
  releasing: boolean
}

const waveformTypes: OscillatorType[] = ['sine', 'triangle', 'sawtooth', 'square']

function noteFrequency(note: number) {
  return 440 * 2 ** ((note - 69) / 12)
}

function finiteParameterValues(values: Readonly<Record<string, number>>) {
  const next = {} as Record<WebSynthParameterId, number>
  for (const parameter of webSynthParameters) {
    const value = values[parameter.id]
    if (!Number.isFinite(value)) throw new RangeError(`Parameter ${parameter.id} must be a finite number.`)
    next[parameter.id] = Math.min(parameter.max, Math.max(parameter.min, value))
  }
  return next
}

export class WebAudioSynth {
  private readonly allocator = new VoiceAllocator(8)
  private readonly voices = new Map<number, VoiceNodes>()
  private readonly listeners = new Set<() => void>()
  private readonly contextFactory: AudioContextFactory
  private context: AudioContext | null = null
  private lfo: OscillatorNode | null = null
  private values: Record<WebSynthParameterId, number> = { ...webSynthDefaultValues }
  private snapshot: AudioSnapshot = { status: 'idle', error: null }

  constructor(contextFactory: AudioContextFactory = () => new AudioContext()) {
    this.contextFactory = contextFactory
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  private update(next: Partial<AudioSnapshot>) {
    this.snapshot = { ...this.snapshot, ...next }
    this.listeners.forEach((listener) => listener())
  }

  async start() {
    if (this.snapshot.status === 'ready' && this.context?.state === 'running') return true
    this.update({ status: 'starting', error: null })
    try {
      this.context ??= this.contextFactory()
      if (this.context.state !== 'running') await this.context.resume()
      if (this.context.state !== 'running') throw new Error('AudioContext did not enter the running state.')
      this.startLfo()
      this.update({ status: 'ready', error: null })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Audio initialization failed.'
      this.update({ status: 'error', error: message })
      return false
    }
  }

  setParameters(values: Readonly<Record<string, number>>) {
    this.values = finiteParameterValues(values)
    if (!this.context || this.snapshot.status !== 'ready') return
    const now = this.context.currentTime
    scheduleSmoothedValue(this.lfo!.frequency, this.values.lfoRate, now)
    for (const voice of this.voices.values()) {
      voice.oscillator1.type = waveformTypes[this.values.osc1Wave]
      voice.oscillator2.type = waveformTypes[this.values.osc2Wave]
      scheduleSmoothedValue(voice.oscillator1.detune, this.values.osc1Detune, now)
      scheduleSmoothedValue(voice.oscillator2.detune, this.values.osc2Detune, now)
      scheduleSmoothedValue(voice.filter.frequency, this.values.filterCutoff, now)
      scheduleSmoothedValue(voice.filter.Q, 0.1 + this.values.filterResonance * 0.2, now)
      this.updateModulationDepth(voice, now)
    }
  }

  noteOn(note: number, velocity = 100) {
    if (!this.context || this.snapshot.status !== 'ready') return false
    if (!Number.isInteger(note) || note < 0 || note > 127) throw new RangeError('MIDI note must be an integer from 0 to 127.')
    const normalizedVelocity = Math.min(127, Math.max(1, Math.round(velocity)))
    const now = this.context.currentTime
    const { lease, stolen } = this.allocator.allocate(note, now)
    if (stolen) this.releaseVoice(stolen.id, 0.005, now)
    this.createVoice(lease.id, note, normalizedVelocity, now + (stolen ? 0.005 : 0))
    return true
  }

  noteOff(note: number) {
    const lease = this.allocator.release(note)
    if (!lease) return false
    this.releaseVoice(lease.id)
    return true
  }

  allNotesOff() {
    const released = this.allocator.releaseAll()
    for (const lease of released) this.releaseVoice(lease.id, 0.015)
    return released.length
  }

  async dispose() {
    this.allNotesOff()
    if (!this.context || this.context.state === 'closed') return
    await this.context.close()
    this.context = null
    this.lfo = null
    this.update({ status: 'idle', error: null })
  }

  get activeVoiceCount() {
    return this.allocator.activeCount
  }

  private startLfo() {
    if (!this.context || this.lfo) return
    this.lfo = this.context.createOscillator()
    this.lfo.type = 'sine'
    this.lfo.frequency.setValueAtTime(this.values.lfoRate, this.context.currentTime)
    this.lfo.start()
  }

  private createVoice(leaseId: number, note: number, velocity: number, startTime: number) {
    const context = this.context
    const lfo = this.lfo
    if (!context || !lfo) throw new Error('Audio output is not ready.')

    const oscillator1 = context.createOscillator()
    const oscillator2 = context.createOscillator()
    const oscillator1Gain = context.createGain()
    const oscillator2Gain = context.createGain()
    const filter = context.createBiquadFilter()
    const ampGain = context.createGain()
    const pitchModGain1 = context.createGain()
    const pitchModGain2 = context.createGain()
    const filterModGain = context.createGain()
    const baseFrequency = noteFrequency(note)

    oscillator1.type = waveformTypes[this.values.osc1Wave]
    oscillator2.type = waveformTypes[this.values.osc2Wave]
    oscillator1.frequency.setValueAtTime(baseFrequency, startTime)
    oscillator2.frequency.setValueAtTime(baseFrequency, startTime)
    oscillator1.detune.setValueAtTime(this.values.osc1Detune, startTime)
    oscillator2.detune.setValueAtTime(this.values.osc2Detune, startTime)
    oscillator1Gain.gain.setValueAtTime(0.5, startTime)
    oscillator2Gain.gain.setValueAtTime(0.5, startTime)
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(this.values.filterCutoff, startTime)
    filter.Q.setValueAtTime(0.1 + this.values.filterResonance * 0.2, startTime)
    ampGain.gain.setValueAtTime(0, startTime)

    oscillator1.connect(oscillator1Gain)
    oscillator2.connect(oscillator2Gain)
    oscillator1Gain.connect(filter)
    oscillator2Gain.connect(filter)
    filter.connect(ampGain)
    ampGain.connect(context.destination)
    lfo.connect(pitchModGain1)
    lfo.connect(pitchModGain2)
    lfo.connect(filterModGain)
    pitchModGain1.connect(oscillator1.frequency)
    pitchModGain2.connect(oscillator2.frequency)
    filterModGain.connect(filter.frequency)

    const voice: VoiceNodes = {
      leaseId,
      note,
      baseFrequency,
      lfo,
      oscillator1,
      oscillator2,
      filter,
      ampGain,
      pitchModGain1,
      pitchModGain2,
      filterModGain,
      stoppedSources: 0,
      releasing: false,
    }
    this.voices.set(leaseId, voice)
    this.updateModulationDepth(voice, startTime)
    this.scheduleAttack(voice, velocity, startTime)

    const onended = () => {
      voice.stoppedSources += 1
      if (voice.stoppedSources < 2) return
      this.voices.delete(leaseId)
      this.allocator.complete(leaseId)
      this.disconnectVoice(voice)
    }
    oscillator1.onended = onended
    oscillator2.onended = onended
    oscillator1.start(startTime)
    oscillator2.start(startTime)
  }

  private scheduleAttack(voice: VoiceNodes, velocity: number, startTime: number) {
    const stages = getEnvelopeStages(
      startTime,
      0.12 / Math.sqrt(this.allocator.capacity) * velocity / 127,
      this.values.ampAttack,
      this.values.ampDecay,
      this.values.ampSustain,
    )
    voice.ampGain.gain.setValueAtTime(0, startTime)
    voice.ampGain.gain.linearRampToValueAtTime(
      0.12 / Math.sqrt(this.allocator.capacity) * velocity / 127,
      stages.attackEnd,
    )
    voice.ampGain.gain.linearRampToValueAtTime(stages.sustainLevel, stages.decayEnd)

    const filterPeak = Math.min(18000, this.values.filterCutoff + (18000 - this.values.filterCutoff) * this.values.filterEnvelopeAmount / 100)
    const filterStages = getEnvelopeStages(
      startTime,
      filterPeak,
      this.values.filterAttack,
      this.values.filterDecay,
      this.values.filterSustain,
    )
    const filterSustainLevel = this.values.filterCutoff
      + (filterPeak - this.values.filterCutoff) * this.values.filterSustain / 100
    voice.filter.frequency.setValueAtTime(this.values.filterCutoff, startTime)
    voice.filter.frequency.linearRampToValueAtTime(filterPeak, filterStages.attackEnd)
    voice.filter.frequency.linearRampToValueAtTime(filterSustainLevel, filterStages.decayEnd)
  }

  private releaseVoice(leaseId: number, duration?: number, startTime?: number) {
    const voice = this.voices.get(leaseId)
    const context = this.context
    if (!voice || !context || voice.releasing) return
    voice.releasing = true
    const now = startTime ?? context.currentTime
    const ampReleaseSeconds = duration ?? Math.max(0.005, this.values.ampRelease / 1000)
    const filterReleaseSeconds = duration ?? Math.max(0.005, this.values.filterRelease / 1000)
    const ampEndTime = now + ampReleaseSeconds
    const filterEndTime = now + filterReleaseSeconds

    voice.ampGain.gain.cancelAndHoldAtTime(now)
    voice.ampGain.gain.linearRampToValueAtTime(0, ampEndTime)
    voice.filter.frequency.cancelAndHoldAtTime(now)
    voice.filter.frequency.linearRampToValueAtTime(this.values.filterCutoff, filterEndTime)
    const stopTime = Math.max(ampEndTime, filterEndTime) + 0.005
    voice.oscillator1.stop(stopTime)
    voice.oscillator2.stop(stopTime)
  }

  private updateModulationDepth(voice: VoiceNodes, now: number) {
    const centsToHz = voice.baseFrequency * (2 ** (this.values.lfoPitchDepth / 1200) - 1)
    scheduleSmoothedValue(voice.pitchModGain1.gain, centsToHz, now)
    scheduleSmoothedValue(voice.pitchModGain2.gain, centsToHz, now)
    scheduleSmoothedValue(
      voice.filterModGain.gain,
      this.values.filterCutoff * this.values.lfoFilterDepth / 100,
      now,
    )
  }

  private disconnectVoice(voice: VoiceNodes) {
    voice.lfo.disconnect(voice.pitchModGain1)
    voice.lfo.disconnect(voice.pitchModGain2)
    voice.lfo.disconnect(voice.filterModGain)
    voice.oscillator1.disconnect()
    voice.oscillator2.disconnect()
    voice.filter.disconnect()
    voice.ampGain.disconnect()
    voice.pitchModGain1.disconnect()
    voice.pitchModGain2.disconnect()
    voice.filterModGain.disconnect()
  }
}

export const webAudioSynth = new WebAudioSynth()
