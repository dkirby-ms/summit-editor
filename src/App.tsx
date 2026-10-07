import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  Cable,
  Download,
  FileInput,
  Minus,
  Music2,
  Plus,
  Power,
  Radio,
  RefreshCw,
  RotateCcw,
  Send,
  SlidersHorizontal,
  Upload,
  Waves,
} from 'lucide-react'
import './App.css'
import { midiEngine } from './midi/midiEngine'
import { validateSysex } from './midi/sysex'
import { useMidi } from './midi/useMidi'
import {
  getParameterValueLabel,
  summitParameters,
  type ParameterDefinition,
  type ParameterId,
  type ParameterSection,
} from './model/parameters'
import { usePatchStore } from './model/patchStore'

const sectionOrder: ParameterSection[] = ['Oscillator', 'Filter', 'LFO', 'Effects']
const whiteKeys = [0, 2, 4, 5, 7, 9, 11, 12]
const blackKeys = [
  { offset: 1, position: 12.5 },
  { offset: 3, position: 25 },
  { offset: 6, position: 50 },
  { offset: 8, position: 62.5 },
  { offset: 10, position: 75 },
]
const noteNames = ['C', 'C sharp', 'D', 'D sharp', 'E', 'F', 'F sharp', 'G', 'G sharp', 'A', 'A sharp', 'B']

function ParameterControl({ parameter }: { parameter: ParameterDefinition }) {
  const value = usePatchStore((state) => state.values[parameter.id as ParameterId])
  const setValue = usePatchStore((state) => state.setValue)

  function update(nextValue: number) {
    const id = parameter.id as ParameterId
    setValue(id, nextValue)
    midiEngine.sendParameter(id, nextValue)
  }

  return (
    <div className="parameter-control">
      <div className="parameter-heading">
        <label htmlFor={parameter.id}>{parameter.shortLabel}</label>
        <output htmlFor={parameter.id}>{getParameterValueLabel(parameter, value)}</output>
      </div>
      {parameter.valueLabels ? (
        <select id={parameter.id} value={value} onChange={(event) => update(Number(event.target.value))}>
          {parameter.valueLabels.map((label, index) => <option key={label} value={index}>{label}</option>)}
        </select>
      ) : (
        <input id={parameter.id} type="range" min={parameter.min} max={parameter.max} value={value} aria-label={parameter.label} onChange={(event) => update(Number(event.target.value))} />
      )}
      <span className="midi-address">
        {parameter.address.type === 'cc' ? `CC ${parameter.address.controller}` : `NRPN ${parameter.address.msb}:${parameter.address.lsb}`}
      </span>
    </div>
  )
}

function EnvelopeView() {
  const values = usePatchStore((state) => state.values)
  const { ampAttack: attack, ampDecay: decay, ampSustain: sustain, ampRelease: release } = values
  const attackX = 30 + (attack / 127) * 80
  const decayX = attackX + 30 + (decay / 127) * 70
  const sustainY = 156 - (sustain / 127) * 116
  const releaseX = 270 + (release / 127) * 80
  const path = `M 24 156 L ${attackX} 40 L ${decayX} ${sustainY} L 270 ${sustainY} L ${releaseX} 156`

  return (
    <section className="envelope-panel" aria-labelledby="envelope-title">
      <div className="section-title-row">
        <div><span className="eyebrow">Visual monitor</span><h2 id="envelope-title">Amplifier envelope</h2></div>
        <Waves aria-hidden="true" />
      </div>
      <svg className="envelope-graph" viewBox="0 0 380 190" role="img" aria-labelledby="envelope-title envelope-summary">
        <title>Amplifier envelope curve</title>
        <desc id="envelope-summary">Attack {attack}, decay {decay}, sustain {sustain}, release {release}</desc>
        <defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" className="grid-line" /></pattern></defs>
        <rect width="380" height="190" fill="url(#grid)" />
        <path d={path} className="envelope-fill" />
        <path d={path} className="envelope-line" />
        <circle cx={attackX} cy="40" r="5" />
        <circle cx={decayX} cy={sustainY} r="5" />
        <circle cx="270" cy={sustainY} r="5" />
      </svg>
      <div className="envelope-readout" aria-hidden="true">
        <span><b>A</b>{attack}</span><span><b>D</b>{decay}</span><span><b>S</b>{sustain}</span><span><b>R</b>{release}</span>
      </div>
      <div className="envelope-controls">
        {summitParameters.filter((parameter) => parameter.section === 'Envelope').map((parameter) => <ParameterControl key={parameter.id} parameter={parameter} />)}
      </div>
    </section>
  )
}

function VirtualKeyboard({ enabled }: { enabled: boolean }) {
  const [octave, setOctave] = useState(4)
  const [velocity, setVelocity] = useState(100)
  const [activeNotes, setActiveNotes] = useState<Set<number>>(() => new Set())
  const baseNote = (octave + 1) * 12

  useEffect(() => () => { midiEngine.allNotesOff() }, [])

  function noteLabel(offset: number) {
    const midiNote = baseNote + offset
    const name = noteNames[midiNote % 12]
    const noteOctave = Math.floor(midiNote / 12) - 1
    return `${name} ${noteOctave}`
  }

  function playNote(note: number) {
    if (!enabled || activeNotes.has(note)) return
    midiEngine.sendNoteOn(note, velocity)
    setActiveNotes((current) => new Set(current).add(note))
  }

  function releaseNote(note: number) {
    if (!enabled) return
    midiEngine.sendNoteOff(note)
    setActiveNotes((current) => {
      const next = new Set(current)
      next.delete(note)
      return next
    })
  }

  function changeOctave(nextOctave: number) {
    midiEngine.allNotesOff()
    setActiveNotes(new Set())
    setOctave(nextOctave)
  }

  function stopAllNotes() {
    midiEngine.allNotesOff()
    setActiveNotes(new Set())
  }

  function keyButton(offset: number, kind: 'white' | 'black', position?: number) {
    const note = baseNote + offset
    return (
      <button
        key={offset}
        type="button"
        className={`piano-key ${kind}-key${activeNotes.has(note) ? ' active-key' : ''}`}
        style={position === undefined ? undefined : { left: `${position}%` }}
        aria-label={`Play ${noteLabel(offset)}`}
        aria-pressed={activeNotes.has(note)}
        disabled={!enabled}
        onPointerDown={(event) => {
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          playNote(note)
        }}
        onPointerUp={() => releaseNote(note)}
        onPointerCancel={() => releaseNote(note)}
      >
        {kind === 'white' && offset % 12 === 0 ? <span>{noteLabel(offset).replace(' ', '')}</span> : null}
      </button>
    )
  }

  return (
    <section className="keyboard-section" aria-labelledby="keyboard-title">
      <div className="keyboard-inner">
        <div className="keyboard-toolbar">
          <div className="keyboard-heading">
            <Music2 aria-hidden="true" />
            <div><span className="eyebrow">Performance</span><h2 id="keyboard-title">Virtual keyboard</h2></div>
          </div>
          <div className="keyboard-controls">
            <div className="octave-control" aria-label="Keyboard octave">
              <button type="button" onClick={() => changeOctave(octave - 1)} disabled={octave <= 1} aria-label="Decrease octave"><Minus aria-hidden="true" /></button>
              <output aria-live="polite">Octave {octave}</output>
              <button type="button" onClick={() => changeOctave(octave + 1)} disabled={octave >= 7} aria-label="Increase octave"><Plus aria-hidden="true" /></button>
            </div>
            <label className="velocity-control"><span>Velocity</span><input type="range" min="1" max="127" value={velocity} onChange={(event) => setVelocity(Number(event.target.value))} /><output>{velocity}</output></label>
            <button className="panic-button" type="button" onClick={stopAllNotes} disabled={!enabled}>All notes off</button>
          </div>
        </div>
        <p className="keyboard-status" role="status">{enabled ? 'Ready on selected MIDI output.' : 'Select a MIDI output to play.'}</p>
        <div className="keyboard-scroll" tabIndex={0} aria-label="Piano keyboard">
          <div className="piano-bed">
            <div className="white-keys">{whiteKeys.map((offset) => keyButton(offset, 'white'))}</div>
            <div className="black-keys">{blackKeys.map(({ offset, position }) => keyButton(offset, 'black', position))}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function App() {
  const midi = useMidi()
  const rawPatch = usePatchStore((state) => state.rawPatch)
  const rawPatchSource = usePatchStore((state) => state.rawPatchSource)
  const setRawPatch = usePatchStore((state) => state.setRawPatch)
  const resetValues = usePatchStore((state) => state.resetValues)
  const fileInput = useRef<HTMLInputElement>(null)
  const [fileMessage, setFileMessage] = useState('No patch captured or imported.')

  async function importPatch(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const bytes = new Uint8Array(await file.arrayBuffer())
    const validation = validateSysex(bytes)
    if (!validation.valid) {
      setFileMessage(validation.reason ?? 'Invalid SysEx file.')
      event.target.value = ''
      return
    }
    setRawPatch(bytes, 'file')
    setFileMessage(`Imported ${file.name} (${bytes.length} bytes).`)
    event.target.value = ''
  }

  function exportPatch() {
    if (!rawPatch) return
    const blob = new Blob([rawPatch as BlobPart], { type: 'audio/x-midi' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'summit-edit-buffer.syx'
    link.click()
    URL.revokeObjectURL(url)
    setFileMessage(`Exported ${rawPatch.length} raw SysEx bytes.`)
  }

  function resetPatch() {
    resetValues()
    const sent = midiEngine.resetHardwareToDefaults()
    setFileMessage(sent ? 'Defaults restored locally and sent to Summit.' : 'Defaults restored locally.')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <div className="brand-mark"><SlidersHorizontal aria-hidden="true" /></div>
          <div><p>NOVATION</p><h1>SUMMIT <span>PATCH LAB</span></h1></div>
        </div>
        <div className="patch-identity"><span>Current workspace</span><strong>INIT PATCH / SINGLE</strong></div>
      </header>

      <section className="connection-strip" aria-labelledby="connection-title">
        <div className="connection-status">
          <span className={`status-light status-${midi.status}`} aria-hidden="true" />
          <div><span className="eyebrow" id="connection-title">Hardware link</span><strong>{midi.status === 'ready' ? 'MIDI ready' : midi.status === 'unsupported' ? 'Offline editor' : midi.status}</strong></div>
        </div>
        <button className="primary-action" type="button" onClick={() => midiEngine.connect()} disabled={midi.status === 'unsupported' || midi.status === 'requesting'}>
          <Power aria-hidden="true" />{midi.status === 'requesting' ? 'Requesting...' : 'Connect MIDI'}
        </button>
        <label><span>Input</span><select value={midi.selectedInputId} onChange={(event) => midiEngine.selectInput(event.target.value)} disabled={midi.status !== 'ready'}><option value="">No input</option>{midi.inputs.map((port) => <option key={port.id} value={port.id}>{port.name}</option>)}</select></label>
        <label><span>Output</span><select value={midi.selectedOutputId} onChange={(event) => midiEngine.selectOutput(event.target.value)} disabled={midi.status !== 'ready'}><option value="">No output</option>{midi.outputs.map((port) => <option key={port.id} value={port.id}>{port.name}</option>)}</select></label>
        <label className="channel-select"><span>Channel</span><select value={midi.channel} onChange={(event) => midiEngine.setChannel(Number(event.target.value))}>{Array.from({ length: 16 }, (_, index) => <option key={index + 1}>{index + 1}</option>)}</select></label>
        <button className="icon-button" type="button" onClick={() => midiEngine.refreshPorts()} title="Refresh MIDI ports" aria-label="Refresh MIDI ports" disabled={midi.status !== 'ready'}><RefreshCw aria-hidden="true" /></button>
        <p className="status-message" role="status" aria-live="polite">{midi.error ?? midi.activity}</p>
      </section>

      <main>
        <div className="workspace-grid">
          <div className="synth-sections">
            {sectionOrder.map((section) => (
              <section className="synth-module" key={section} aria-labelledby={`section-${section}`}>
                <div className="module-heading"><span>{String(sectionOrder.indexOf(section) + 1).padStart(2, '0')}</span><h2 id={`section-${section}`}>{section}</h2></div>
                <div className="parameter-grid">{summitParameters.filter((parameter) => parameter.section === section).map((parameter) => <ParameterControl key={parameter.id} parameter={parameter} />)}</div>
              </section>
            ))}
          </div>
          <aside className="visual-column">
            <EnvelopeView />
            <section className="patch-panel" aria-labelledby="patch-panel-title">
              <div className="section-title-row"><div><span className="eyebrow">Raw SysEx</span><h2 id="patch-panel-title">Patch transfer</h2></div><Radio aria-hidden="true" /></div>
              <p className="patch-state">{rawPatch ? `${rawPatch.length} bytes / ${rawPatchSource === 'device' ? 'Captured' : 'Imported'}` : fileMessage}</p>
              <div className="patch-actions">
                <button type="button" onClick={() => midiEngine.requestEditBuffer()} disabled={!midi.selectedOutputId} title="Experimental: request the Summit edit buffer"><Download aria-hidden="true" /> Fetch <span>EXP</span></button>
                <button type="button" onClick={() => fileInput.current?.click()}><Upload aria-hidden="true" /> Import</button>
                <input ref={fileInput} className="visually-hidden" type="file" accept=".syx,audio/x-midi" aria-label="Import SysEx patch file" onChange={importPatch} />
                <button type="button" onClick={exportPatch} disabled={!rawPatch}><FileInput aria-hidden="true" /> Export</button>
                <button type="button" onClick={() => rawPatch && midiEngine.sendSysex(rawPatch)} disabled={!rawPatch || !midi.selectedOutputId}><Send aria-hidden="true" /> Send</button>
              </div>
              <p className="patch-note">Fetch framing is experimental pending Summit hardware validation. Imported and captured patches remain raw.</p>
            </section>
          </aside>
        </div>
      </main>

      <VirtualKeyboard enabled={Boolean(midi.selectedOutputId)} />

      <footer className="app-footer">
        <div><Cable aria-hidden="true" /><span>Web MIDI / SysEx</span></div>
        <p>Best in current Chrome, Edge, or Firefox on desktop. HTTPS or localhost required.</p>
        <button type="button" onClick={resetPatch}><RotateCcw aria-hidden="true" /> Reset defaults</button>
      </footer>
    </div>
  )
}

export default App
