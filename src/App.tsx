import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from 'react'
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
} from './model/parameters'
import { usePatchStore } from './model/patchStore'

function PanelModule({ id, title, className, children }: { id: string; title: string; className: string; children: ReactNode }) {
  return (
    <section className={`peak-module ${className}`} aria-labelledby={id}>
      <h2 id={id} className="peak-module-title">{title}</h2>
      {children}
    </section>
  )
}

function UnavailableControls({ children }: { children: ReactNode }) {
  return <div className="unavailable-controls"><span>Not yet implemented</span><p>{children}</p></div>
}

const parameterList: readonly ParameterDefinition[] = summitParameters

function parametersInSection(section: string) {
  return parameterList.filter((parameter) => parameter.section === section)
}

function ParameterGroup({ parameters, disabled }: { parameters: readonly ParameterDefinition[]; disabled?: (parameter: ParameterDefinition) => boolean }) {
  return <>{parameters.map((parameter) => <ParameterControl key={parameter.id} parameter={parameter} disabled={disabled?.(parameter)} />)}</>
}

const whiteKeys = [0, 2, 4, 5, 7, 9, 11, 12]
const blackKeys = [
  { offset: 1, position: 12.5 },
  { offset: 3, position: 25 },
  { offset: 6, position: 50 },
  { offset: 8, position: 62.5 },
  { offset: 10, position: 75 },
]
const noteNames = ['C', 'C sharp', 'D', 'D sharp', 'E', 'F', 'F sharp', 'G', 'G sharp', 'A', 'A sharp', 'B']

function ParameterControl({ parameter, disabled = false }: { parameter: ParameterDefinition; disabled?: boolean }) {
  const value = usePatchStore((state) => state.values[parameter.id as ParameterId])
  const setValue = usePatchStore((state) => state.setValue)

  function update(nextValue: number) {
    if (disabled) return
    const id = parameter.id as ParameterId
    setValue(id, nextValue)
    midiEngine.sendParameter(id, nextValue)
  }

  return (
    <div className={`parameter-control${parameter.prominent ? ' prominent' : ''}${disabled ? ' disabled' : ''}`}>
      <div className="parameter-heading">
        <label id={`${parameter.id}-label`} htmlFor={parameter.valueLabels || parameter.fader ? parameter.id : undefined}>{parameter.shortLabel}</label>
        <output>{getParameterValueLabel(parameter, value)}</output>
      </div>
      {parameter.valueLabels ? (
        <select id={parameter.id} value={value} disabled={disabled} onChange={(event) => update(Number(event.target.value))}>
          {parameter.valueLabels.map((label, index) => <option key={index} value={parameter.min + index}>{label}</option>)}
        </select>
      ) : parameter.fader ? (
        <input id={parameter.id} type="range" min={parameter.min} max={parameter.max} value={value} disabled={disabled} aria-label={parameter.label} aria-orientation="vertical" onChange={(event) => update(Number(event.target.value))} />
      ) : (
        <RotaryControl
          id={parameter.id}
          label={parameter.label}
          min={parameter.min}
          max={parameter.max}
          value={value}
          valueText={getParameterValueLabel(parameter, value)}
          large={parameter.prominent}
          disabled={disabled}
          onChange={update}
        />
      )}
      <span className="midi-address">
        {parameter.address.type === 'cc' ? `CC ${parameter.address.controller}` : `NRPN ${parameter.address.msb}:${parameter.address.lsb}`}
      </span>
    </div>
  )
}

function RotaryControl({
  id,
  label,
  min,
  max,
  value,
  valueText,
  large = false,
  disabled = false,
  onChange,
}: {
  id: string
  label: string
  min: number
  max: number
  value: number
  valueText: string
  large?: boolean
  disabled?: boolean
  onChange: (value: number) => void
}) {
  const dragStart = useRef<{ pointerId: number; y: number; value: number } | null>(null)
  const range = max - min
  const angle = range === 0 ? 0 : -135 + ((value - min) / range) * 270

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    const step = event.shiftKey ? 10 : 1
    let nextValue: number
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        nextValue = value + step
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        nextValue = value - step
        break
      case 'PageUp':
        nextValue = value + 10
        break
      case 'PageDown':
        nextValue = value - 10
        break
      case 'Home':
        nextValue = min
        break
      case 'End':
        nextValue = max
        break
      default:
        return
    }
    event.preventDefault()
    onChange(Math.min(max, Math.max(min, nextValue)))
  }

  return (
    <div
      id={id}
      className={`rotary-control${large ? ' large' : ''}`}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      aria-description="Drag up or down to adjust. Use arrow keys to change by one, or Shift with an arrow key to change by ten."
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => {
        event.preventDefault()
        if (disabled) return
        event.currentTarget.setPointerCapture?.(event.pointerId)
        dragStart.current = { pointerId: event.pointerId, y: event.clientY, value }
      }}
      onPointerMove={(event) => {
        const start = dragStart.current
        if (!start || start.pointerId !== event.pointerId) return
        const sensitivity = event.shiftKey ? 4 : 1
        const delta = Math.round(((start.y - event.clientY) / sensitivity) * (range / 120))
        onChange(Math.min(max, Math.max(min, start.value + delta)))
      }}
      onPointerUp={(event) => {
        if (dragStart.current?.pointerId === event.pointerId) dragStart.current = null
      }}
      onPointerCancel={() => { dragStart.current = null }}
    >
      <span className="rotary-dial" aria-hidden="true">
        <span className="rotary-indicator" style={{ transform: `rotate(${angle}deg)` }} />
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
    <PanelModule id="envelope-title" title="Amp envelope" className="amp-module">
      <div className="envelope-controls">
        <ParameterGroup parameters={parametersInSection('Envelope').filter((parameter) => parameter.fader)} />
      </div>
      <svg className="envelope-graph" viewBox="0 0 380 190" role="img" aria-labelledby="envelope-graph-title envelope-summary">
        <title id="envelope-graph-title">Amplifier envelope curve</title>
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
      <div className="parameter-grid envelope-options">
        <ParameterGroup parameters={parametersInSection('Envelope').filter((parameter) => !parameter.fader)} />
      </div>
    </PanelModule>
  )
}

function ModEnvelopeModule() {
  const [selected, setSelected] = useState<1 | 2>(1)
  const parameters = parametersInSection(`Mod envelope ${selected}`)

  return (
    <PanelModule id="mod-envelopes-title" title="Mod envelopes" className="mod-envelopes-module">
      <div className="lfo-selector" role="group" aria-label="Select mod envelope">
        {([1, 2] as const).map((envelope) => (
          <button key={envelope} type="button" aria-pressed={selected === envelope} onClick={() => setSelected(envelope)}>
            Mod env {envelope}
          </button>
        ))}
      </div>
      <div className="envelope-controls">
        <ParameterGroup parameters={parameters.filter((parameter) => parameter.fader)} />
      </div>
      <div className="parameter-grid envelope-options">
        <ParameterGroup parameters={parameters.filter((parameter) => !parameter.fader)} />
      </div>
      <p className="module-note">Mod envelope depths are set per destination in the oscillator and filter modules.</p>
    </PanelModule>
  )
}

function LfoModule() {
  const [selectedLfo, setSelectedLfo] = useState(1)
  const parameters = parameterList.filter((parameter) => parameter.id.startsWith(`lfo${selectedLfo}`))
  const range = usePatchStore((state) => (selectedLfo === 1 ? state.values.lfo1Range : selectedLfo === 2 ? state.values.lfo2Range : null))
  const isSynced = range === LFO_RANGE_SYNC

  function isDisabled(parameter: ParameterDefinition) {
    if (parameter.id.endsWith('SyncRate')) return !isSynced
    if (parameter.id.endsWith('Rate')) return isSynced
    return false
  }

  return (
    <PanelModule id="lfo-title" title="LFOs" className="lfo-module">
      <div className="lfo-selector" role="group" aria-label="Select LFO">
        {[1, 2, 3, 4].map((lfo) => (
          <button
            key={lfo}
            type="button"
            aria-pressed={selectedLfo === lfo}
            onClick={() => setSelectedLfo(lfo)}
          >
            LFO {lfo}
          </button>
        ))}
      </div>
      <div className="parameter-grid" id="lfo-controls">
        <ParameterGroup parameters={parameters} disabled={isDisabled} />
      </div>
      <p className="module-note">
        {selectedLfo <= 2
          ? `Rate applies in Low and High range; Sync rate applies when Range is Sync.`
          : `LFO ${selectedLfo} wave and rate have no published MIDI address, so only phase, slew and fade time are editable.`}
      </p>
    </PanelModule>
  )
}

const LFO_RANGE_SYNC = 2
const DUAL_FILTER_SHAPE = 3

function FilterModule() {
  const isDual = usePatchStore((state) => state.values.filterShape === DUAL_FILTER_SHAPE)
  const filterParameters: ParameterDefinition[] = summitParameters.filter((parameter) => parameter.section === 'Filter')
  const featured = filterParameters.filter((parameter) => parameter.prominent)
  const others = filterParameters.filter((parameter) => !parameter.prominent)

  return (
    <PanelModule id="filter-title" title="Filter" className="filter-module">
      {featured.map((parameter) => <ParameterControl key={parameter.id} parameter={parameter} />)}
      <div className="parameter-grid">{others.map((parameter) => <ParameterControl key={parameter.id} parameter={parameter} />)}</div>
      <div className="dual-filter" role="group" aria-labelledby="dual-filter-title">
        <h3 id="dual-filter-title" className="sub-module-title">Dual filter</h3>
        <div className="parameter-grid">
          {summitParameters.filter((parameter) => parameter.section === 'Dual filter').map((parameter) => <ParameterControl key={parameter.id} parameter={parameter} disabled={!isDual} />)}
        </div>
        <p className="module-note">{isDual ? 'Combinations: ">" runs in series, "+" runs in parallel.' : 'Set Shape to Dual to edit the filter combination and separation.'} The dual combination and separation NRPNs are not in Novation's published MIDI table, so they need hardware verification.</p>
      </div>
      <div className="filter-modulation" role="group" aria-labelledby="filter-modulation-title">
        <h3 id="filter-modulation-title" className="sub-module-title">Modulation</h3>
        <div className="parameter-grid">
          <ParameterGroup parameters={parametersInSection('Filter modulation')} />
        </div>
        <p className="module-note">Each depth is shown separately, so the panel's envelope-select button is not needed. Divergence is in the Voice menu.</p>
      </div>
    </PanelModule>
  )
}

const menuTabs = [
  { id: 'voice', label: 'Voice', section: 'Voice menu' },
  { id: 'common', label: 'Osc common', section: 'Oscillator common menu' },
  { id: 'osc1', label: 'Osc 1', section: 'Oscillator 1 menu' },
  { id: 'osc2', label: 'Osc 2', section: 'Oscillator 2 menu' },
  { id: 'osc3', label: 'Osc 3', section: 'Oscillator 3 menu' },
  { id: 'noise', label: 'Noise', section: 'Noise menu' },
] as const

function MenuSettingsModule() {
  const [selected, setSelected] = useState<(typeof menuTabs)[number]['id']>('voice')

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number
    if (event.key === 'ArrowRight') next = (index + 1) % menuTabs.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + menuTabs.length) % menuTabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = menuTabs.length - 1
    else return
    event.preventDefault()
    setSelected(menuTabs[next].id)
    document.getElementById(`menu-tab-${menuTabs[next].id}`)?.focus()
  }

  return (
    <PanelModule id="menu-settings-title" title="Voice & oscillator menus" className="menu-module">
      <div className="lfo-selector menu-tabs" role="tablist" aria-label="Menu page">
        {menuTabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`menu-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected === tab.id}
            aria-controls={`menu-panel-${tab.id}`}
            tabIndex={selected === tab.id ? 0 : -1}
            onClick={() => setSelected(tab.id)}
            onKeyDown={(event) => handleTabKey(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {menuTabs.map((tab) => (
        <div key={tab.id} id={`menu-panel-${tab.id}`} role="tabpanel" aria-labelledby={`menu-tab-${tab.id}`} hidden={selected !== tab.id}>
          <div className="parameter-grid menu-grid">
            {summitParameters.filter((parameter) => parameter.section === tab.section).map((parameter) => <ParameterControl key={parameter.id} parameter={parameter} />)}
          </div>
        </div>
      ))}
      <p className="module-note">Settings that live in the Summit's Voice and Osc menus rather than on panel knobs. Ranges and value orders follow the MIDI parameter list in Novation's Summit user guide. The noise high-pass NRPN is not in that list, so Reset defaults does not send it. Tuning table selection is not yet implemented.</p>
    </PanelModule>
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
        <div className="patch-identity"><span>Current workspace</span><strong>PEAK-STYLE / SINGLE PART</strong></div>
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
        <div className="panel-workspace">
          <div className="panel-intro">
            <div><span className="eyebrow">SUMMIT sound engine</span><h2>One part. One PEAK-style panel.</h2></div>
            <p>Editing uses the selected MIDI channel. Independent A/B layer editing is not yet implemented.</p>
          </div>
          <div className="peak-panel" aria-label="PEAK-style synth panel">
            <div className="utility-module">
              <PanelModule id="master-title" title="Master / Animate" className="master-module">
                <UnavailableControls>Master volume and Animate switches.</UnavailableControls>
              </PanelModule>
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
            </div>
            <PanelModule id="arp-title" title="Arp" className="arp-module">
              <UnavailableControls>Gate, key latch and arpeggiator on/off.</UnavailableControls>
            </PanelModule>
            <LfoModule />
            <PanelModule id="glide-title" title="Glide" className="glide-module">
              <div className="parameter-grid"><ParameterGroup parameters={parametersInSection('Glide')} /></div>
            </PanelModule>
            <EnvelopeView />
            <ModEnvelopeModule />
            <div className="oscillator-bank">
              {[1, 2, 3].map((oscillator) => {
                const parameters = summitParameters.filter((parameter) => parameter.section === `Oscillator ${oscillator}`)
                return (
                  <PanelModule key={oscillator} id={`oscillator-${oscillator}-title`} title={`Oscillator ${oscillator}`} className="oscillator-module">
                    <div className="parameter-grid">{parameters.map((parameter) => <ParameterControl key={parameter.id} parameter={parameter} />)}</div>
                    <p className="module-note">Mod depths are centred at 0. Each source has its own depth, so the panel's shape-source button is not needed.</p>
                  </PanelModule>
                )
              })}
            </div>
            <PanelModule id="mixer-title" title="Mixer" className="mixer-module">
              <div className="parameter-grid">{summitParameters.filter((parameter) => parameter.section === 'Mixer').map((parameter) => <ParameterControl key={parameter.id} parameter={parameter} />)}</div>
            </PanelModule>
            <FilterModule />
            <section className="effects-bank" aria-labelledby="effects-title">
              <h2 id="effects-title" className="visually-hidden">Effects</h2>
              <div className="effects-top-row">
                {summitParameters.filter((parameter) => parameter.id === 'distortionLevel' || parameter.id === 'chorusLevel').map((parameter) => (
                  <PanelModule key={parameter.id} id={`${parameter.id}-title`} title={parameter.shortLabel} className="effect-module">
                    <ParameterControl parameter={parameter} />
                  </PanelModule>
                ))}
              </div>
              {summitParameters.filter((parameter) => parameter.id === 'delayLevel' || parameter.id === 'reverbLevel').map((parameter) => (
                <PanelModule key={parameter.id} id={`${parameter.id}-title`} title={parameter.shortLabel} className="effect-module">
                  <ParameterControl parameter={parameter} />
                </PanelModule>
              ))}
              <p className="module-note">Effect levels only. Other effect controls and bypass are not yet implemented.</p>
            </section>
            <MenuSettingsModule />
            <div className="panel-caption"><Waves aria-hidden="true" /><span>PEAK-inspired layout / SUMMIT MIDI</span><span>Documented controls only</span></div>
          </div>
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
