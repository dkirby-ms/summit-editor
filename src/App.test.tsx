import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { defaultPatchValues, summitParameters } from './model/parameters'
import { usePatchStore } from './model/patchStore'
import { midiEngine } from './midi/midiEngine'

describe('Summit Patch Lab', () => {
  beforeEach(() => usePatchStore.setState({ values: { ...defaultPatchValues }, rawPatch: null, rawPatchSource: null }))
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('places every existing parameter once in its PEAK panel section', () => {
    render(<App />)
    const behindSelector = /^(lfo[234]|modEnv2)/
    for (const parameter of summitParameters) {
      expect(document.querySelectorAll(`[id="${parameter.id}"]`)).toHaveLength(behindSelector.test(parameter.id) ? 0 : 1)
    }
    expect(within(screen.getByRole('region', { name: 'Oscillator 1' })).getByLabelText('Wave')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'LFOs' })).getByRole('combobox', { name: 'Sync rate' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Filter' })).getByLabelText('Filter resonance')).toBeInTheDocument()
    for (const label of ['Attack', 'Decay', 'Sustain', 'Release']) {
      expect(within(screen.getByRole('region', { name: 'Amp envelope' })).getByLabelText(`Amplifier envelope ${label.toLowerCase()}`)).toHaveAttribute('aria-orientation', 'vertical')
    }
    for (const name of ['Distortion', 'Chorus', 'Delay', 'Reverb']) {
      expect(within(screen.getByRole('region', { name })).getByLabelText(`${name} level`)).toBeInTheDocument()
    }
  })

  it('marks unsupported PEAK sections without offering non-working controls', () => {
    render(<App />)
    for (const name of ['Master / Animate', 'Arp']) {
      const section = within(screen.getByRole('region', { name }))
      expect(section.getByText('Not yet implemented')).toBeInTheDocument()
      expect(section.queryByRole('slider')).not.toBeInTheDocument()
      expect(section.queryByRole('button')).not.toBeInTheDocument()
      expect(section.queryByRole('combobox')).not.toBeInTheDocument()
    }
    expect(screen.getByText(/Independent A\/B layer editing is not yet implemented/)).toBeInTheDocument()
  })

  it('offers documented oscillator, mixer, and filter sound controls', () => {
    render(<App />)
    for (const oscillator of [1, 2, 3]) {
      const section = within(screen.getByRole('region', { name: `Oscillator ${oscillator}` }))
      expect(section.getByLabelText('Wave')).toBeInTheDocument()
      expect(section.getByLabelText('Range')).toHaveDisplayValue("8'")
      for (const control of ['coarse tuning', 'fine tuning', 'manual shape']) {
        expect(section.getByRole('slider', { name: `Oscillator ${oscillator} ${control}` })).toBeInTheDocument()
      }
    }
    const mixer = within(screen.getByRole('region', { name: 'Mixer' }))
    for (const control of ['Oscillator 1 level', 'Oscillator 2 level', 'Oscillator 3 level', 'Ring modulator level', 'Noise level', 'VCA level']) {
      expect(mixer.getByRole('slider', { name: control })).toBeInTheDocument()
    }
    const filter = within(screen.getByRole('region', { name: 'Filter' }))
    for (const control of ['Filter frequency', 'Filter key tracking', 'Filter post drive']) {
      expect(filter.getByRole('slider', { name: control })).toBeInTheDocument()
    }
    expect(filter.getByRole('slider', { name: 'Filter frequency' })).toHaveClass('large')
    expect(filter.getByRole('slider', { name: 'Filter resonance' })).not.toHaveClass('large')
    expect(filter.getByLabelText('Slope')).toBeInTheDocument()
  })

  it('enables dual filter combination and separation only in dual mode', async () => {
    const user = userEvent.setup()
    const send = vi.spyOn(midiEngine, 'sendParameter').mockReturnValue(true)
    render(<App />)
    const filter = within(screen.getByRole('region', { name: 'Filter' }))
    const combination = filter.getByLabelText('Combination')
    const separation = filter.getByRole('slider', { name: 'Dual filter separation' })
    expect(combination).toBeDisabled()
    expect(separation).toHaveAttribute('aria-disabled', 'true')

    await user.selectOptions(filter.getByLabelText('Shape'), 'Dual')
    expect(send).toHaveBeenCalledWith('filterShape', 3)
    expect(combination).toBeEnabled()
    expect(separation).not.toHaveAttribute('aria-disabled')

    await user.selectOptions(combination, 'LP + HP')
    expect(send).toHaveBeenCalledWith('filterDualType', 3)
  })

  it('exposes menu-only voice and oscillator settings in tabs', async () => {
    const user = userEvent.setup()
    render(<App />)
    const menus = within(screen.getByRole('region', { name: 'Voice & oscillator menus' }))
    expect(menus.getByRole('tab', { name: 'Voice' })).toHaveAttribute('aria-selected', 'true')
    expect(menus.getByLabelText('Mode')).toHaveDisplayValue('Poly')
    expect(menus.getByLabelText('Unison')).toHaveDisplayValue('1')
    expect(menus.getByLabelText('Spread mode')).toHaveDisplayValue('Diverge')
    expect(menus.getByRole('slider', { name: 'Pre-glide' })).toHaveAttribute('aria-valuetext', '0')
    expect(menus.getByRole('slider', { name: 'Unison detune' })).toBeInTheDocument()
    expect(menus.queryByRole('slider', { name: 'Oscillator 2 bend range' })).not.toBeInTheDocument()

    await user.click(menus.getByRole('tab', { name: 'Osc 2' }))
    expect(menus.getByRole('combobox', { name: 'Wavetable' })).toHaveDisplayValue('BS Sine')
    expect(menus.getByRole('combobox', { name: 'Fixed note' })).toHaveDisplayValue('Off')
    for (const control of ['saw density', 'density detune', 'bend range', 'virtual sync']) {
      expect(menus.getByRole('slider', { name: `Oscillator 2 ${control}` })).toBeInTheDocument()
    }
    expect(menus.getByRole('slider', { name: 'Oscillator 2 bend range' })).toHaveAttribute('aria-valuetext', '+12')
    expect(menus.queryByRole('slider', { name: 'Unison detune' })).not.toBeInTheDocument()

    await user.click(menus.getByRole('tab', { name: 'Osc common' }))
    expect(menus.getByRole('slider', { name: 'Oscillator divergence' })).toBeVisible()
    expect(menus.getByRole('slider', { name: 'Oscillator drift' })).toBeVisible()
    await user.click(menus.getByRole('tab', { name: 'Osc 2' }))
    menus.getByRole('tab', { name: 'Osc 2' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(menus.getByRole('tab', { name: 'Osc 3' })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches between four LFOs and gates rate against sync rate by range', async () => {
    const user = userEvent.setup()
    const sendParameter = vi.spyOn(midiEngine, 'sendParameter').mockReturnValue(false)
    render(<App />)

    const lfoPanel = within(screen.getByRole('region', { name: 'LFOs' }))
    expect(lfoPanel.getByRole('button', { name: 'LFO 1' })).toHaveAttribute('aria-pressed', 'true')
    const syncRate = lfoPanel.getByRole('combobox', { name: 'Sync rate' })
    expect(syncRate).toBeDisabled()
    expect(syncRate).toHaveDisplayValue('8 beats')
    expect(lfoPanel.getByRole('slider', { name: 'LFO 1 rate' })).not.toHaveAttribute('aria-disabled')
    expect(lfoPanel.getByRole('combobox', { name: 'Phase' })).toHaveDisplayValue('Free')

    await user.selectOptions(lfoPanel.getByRole('combobox', { name: 'Range' }), 'Sync')
    expect(sendParameter).toHaveBeenCalledWith('lfo1Range', 2)
    expect(lfoPanel.getByRole('combobox', { name: 'Sync rate' })).toBeEnabled()
    expect(lfoPanel.getByRole('slider', { name: 'LFO 1 rate' })).toHaveAttribute('aria-disabled', 'true')

    await user.click(lfoPanel.getByRole('button', { name: 'LFO 2' }))
    expect(lfoPanel.getByRole('slider', { name: 'LFO 2 rate' })).toBeInTheDocument()
    expect(lfoPanel.getByRole('combobox', { name: 'Sync rate' })).toBeDisabled()

    for (const lfo of [3, 4]) {
      await user.click(lfoPanel.getByRole('button', { name: `LFO ${lfo}` }))
      expect(lfoPanel.getByRole('button', { name: `LFO ${lfo}` })).toHaveAttribute('aria-pressed', 'true')
      expect(lfoPanel.getByRole('slider', { name: `LFO ${lfo} slew` })).toBeInTheDocument()
      expect(lfoPanel.queryByRole('combobox', { name: 'Wave' })).not.toBeInTheDocument()
      expect(lfoPanel.getByText(`LFO ${lfo} wave and rate have no published MIDI address`, { exact: false })).toBeInTheDocument()
    }
  })

  it('edits mod envelopes, glide and filter modulation depths', async () => {
    const user = userEvent.setup()
    const sendParameter = vi.spyOn(midiEngine, 'sendParameter').mockReturnValue(false)
    render(<App />)

    const modEnv = within(screen.getByRole('region', { name: 'Mod envelopes' }))
    expect(modEnv.getByLabelText('Mod envelope 1 attack')).toHaveAttribute('aria-orientation', 'vertical')
    expect(modEnv.getByRole('combobox', { name: 'MonoTrig' })).toHaveDisplayValue('Re-Trig')
    await user.click(modEnv.getByRole('button', { name: 'Mod env 2' }))
    expect(modEnv.getByRole('button', { name: 'Mod env 2' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.change(modEnv.getByLabelText('Mod envelope 2 decay'), { target: { value: '100' } })
    expect(sendParameter).toHaveBeenCalledWith('modEnv2Decay', 100)
    expect(modEnv.queryByLabelText('Mod envelope 1 attack')).not.toBeInTheDocument()

    const glide = within(screen.getByRole('region', { name: 'Glide' }))
    await user.selectOptions(glide.getByRole('combobox', { name: 'Glide' }), 'On')
    expect(sendParameter).toHaveBeenCalledWith('glideOn', 1)
    expect(glide.getByRole('slider', { name: 'Glide time' })).toBeInTheDocument()

    const filter = within(screen.getByRole('region', { name: 'Filter' }))
    expect(filter.getByRole('slider', { name: 'LFO 1 to filter frequency depth' })).toHaveAttribute('aria-valuetext', '0')
    expect(filter.getByRole('slider', { name: 'Oscillator 3 to filter frequency depth' })).toHaveAttribute('aria-valuetext', '0')
    expect(filter.queryByText('Not yet implemented')).not.toBeInTheDocument()

    const amp = within(screen.getByRole('region', { name: 'Amp envelope' }))
    expect(amp.getByRole('combobox', { name: 'MonoTrig' })).toHaveDisplayValue('Legato')
    expect(within(screen.getByRole('region', { name: 'Oscillator 2' })).getByRole('slider', { name: /Oscillator 2 mod envelope 2 to pitch/i })).toHaveAttribute('aria-valuetext', '0')
  })

  it('preserves parameter MIDI sends after rearranging controls', () => {
    const sendParameter = vi.spyOn(midiEngine, 'sendParameter').mockReturnValue(false)
    render(<App />)
    const resonance = screen.getByRole('slider', { name: 'Filter resonance' })
    fireEvent.pointerDown(resonance, { pointerId: 1, clientY: 100 })
    fireEvent.pointerMove(resonance, { pointerId: 1, clientY: 60 })
    expect(usePatchStore.getState().values.filterResonance).toBe(42)
    expect(sendParameter).toHaveBeenCalledWith('filterResonance', 42)
  })

  it('supports keyboard operation for rotary controls while keeping ADSR sliders', () => {
    render(<App />)
    const resonance = screen.getByRole('slider', { name: 'Filter resonance' })
    fireEvent.keyDown(resonance, { key: 'ArrowUp' })
    expect(resonance).toHaveAttribute('aria-valuenow', '1')
    fireEvent.keyDown(resonance, { key: 'End' })
    expect(resonance).toHaveAttribute('aria-valuenow', '127')
    expect(screen.getByLabelText('Amplifier envelope attack')).toHaveAttribute('type', 'range')
  })

  it('renders an offline editor with grouped documented controls', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /summit patch lab/i })).toBeInTheDocument()
    expect(screen.getByText('Offline editor')).toBeInTheDocument()
    expect(screen.getByLabelText('Filter resonance')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /amplifier envelope/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /connect midi/i })).toBeDisabled()
  })

  it('edits and resets values without hardware', async () => {
    const user = userEvent.setup()
    render(<App />)
    const attack = screen.getByLabelText('Amplifier envelope attack')
    const initialAttack = defaultPatchValues.ampAttack
    fireEvent.change(attack, { target: { value: initialAttack + 2 } })
    expect(usePatchStore.getState().values.ampAttack).toBe(initialAttack + 2)
    const resetButton = screen.getByRole('button', { name: /reset defaults/i })
    resetButton.focus()
    await user.keyboard('{Enter}')
    expect(usePatchStore.getState().values).toEqual(defaultPatchValues)
    expect(screen.getByText('Defaults restored locally.')).toBeInTheDocument()
  })

  it('keeps raw patch actions unavailable until data exists', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /export/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^send$/i })).toBeDisabled()
    expect(screen.getByText(/fetch framing is experimental/i)).toBeInTheDocument()
  })

  it('renders an offline virtual keyboard with octave and velocity controls', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: /virtual keyboard/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play C 4' })).toBeDisabled()
    expect(screen.getByText('Select a MIDI output to play.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /increase octave/i }))
    expect(screen.getByText('Octave 5')).toBeInTheDocument()
    expect(screen.getByLabelText('Velocity')).toHaveValue('100')
  })
})
