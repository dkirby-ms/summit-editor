import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { usePatchStore } from './model/patchStore'
import { webSynthDefaultValues, webSynthParameters } from './model/webSynthProfile'
import { subtractiveLessons, tutorialInitialValues } from './model/subtractiveTutorial'
import { readWebSynthPresets, webSynthPresetStorageKey } from './model/webSynthPresetStorage'
import { webAudioSynth } from './audio/webAudioSynth'

describe('subtractive synthesis tutorial', () => {
  beforeEach(() => {
    localStorage.clear()
    usePatchStore.getState().setActiveProfile('web-synth')
    usePatchStore.getState().applyProfileValues('web-synth', webSynthDefaultValues)
    vi.spyOn(webAudioSynth, 'allNotesOff')
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('is opt-in, hides locked controls from keyboard access, and restores the original patch', async () => {
    const user = userEvent.setup()
    const original = { ...webSynthDefaultValues, filterCutoff: 2345 }
    usePatchStore.getState().applyProfileValues('web-synth', original)
    render(<App />)
    expect(screen.getByRole('region', { name: 'Filter' })).toBeInTheDocument()
    expect(usePatchStore.getState().values).toEqual(original)

    await user.click(screen.getByRole('button', { name: 'Start tutorial' }))
    expect(usePatchStore.getState().values).toEqual(tutorialInitialValues)
    expect(screen.getByRole('heading', { name: /Start with harmonics/ })).toHaveFocus()
    expect(screen.queryByRole('region', { name: 'Oscillator 2' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Filter' })).not.toBeInTheDocument()
    expect(screen.queryByRole('slider', { name: 'Oscillator 1 detune' })).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Web synth preset' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Claim badge and continue' })).toBeDisabled()
    const waveform = within(screen.getByRole('group', { name: 'Oscillator 1 waveform' }))
    waveform.getByRole('radio', { name: 'Sine' }).focus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(waveform.getByRole('radio', { name: 'Sawtooth' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Claim badge and continue' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Claim badge and continue' }))
    expect(screen.getByRole('region', { name: 'Oscillator 2' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Filter' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Leave and restore previous patch' }))
    expect(usePatchStore.getState().values).toEqual(original)
    expect(screen.getByRole('button', { name: 'Start tutorial' })).toHaveFocus()
    expect(screen.getByRole('region', { name: 'Filter' })).toBeInTheDocument()
  })

  it('builds a patch with real controls, awards each badge, and saves and recalls a complete preset after remount', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.click(screen.getByRole('button', { name: 'Start tutorial' }))
    await user.click(within(screen.getByRole('group', { name: 'Oscillator 1 waveform' })).getByRole('radio', { name: 'Sawtooth' }))
    await user.click(screen.getByRole('button', { name: 'Claim badge and continue' }))
    fireEvent.change(screen.getByRole('slider', { name: 'Oscillator 2 level' }), { target: { value: '30' } })
    await user.click(screen.getByRole('button', { name: 'Claim badge and continue' }))
    for (const oscillator of [1, 2]) {
      const cutoff = screen.getByRole('slider', { name: `Oscillator ${oscillator} filter cutoff` })
      cutoff.focus()
      await user.keyboard('{Home}')
      for (let i = 0; i < 4; i++) await user.keyboard('{PageUp}')
      expect(screen.getByRole('button', { name: 'Claim badge and continue' })).toBeDisabled()
      // Pointer drags use the same real rotary control path as the editor.
      fireEvent.pointerDown(cutoff, { pointerId: 1, clientY: 120 })
      fireEvent.pointerMove(cutoff, { pointerId: 1, clientY: 106 })
      fireEvent.pointerUp(cutoff, { pointerId: 1 })
      const resonance = screen.getByRole('slider', { name: `Oscillator ${oscillator} filter resonance` })
      resonance.focus()
      await user.keyboard('{PageUp}{PageUp}')
    }
    expect(screen.getByRole('button', { name: 'Claim badge and continue' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Claim badge and continue' }))
    fireEvent.change(screen.getByRole('slider', { name: 'Amplifier sustain' }), { target: { value: '30' } })
    await user.click(screen.getByRole('button', { name: 'Claim badge and continue' }))
    const amount = screen.getByRole('slider', { name: 'Filter envelope amount' })
    amount.focus()
    await user.keyboard('{PageUp}{PageUp}{PageUp}')
    await user.click(screen.getByRole('button', { name: 'Claim badge and continue' }))
    screen.getByRole('slider', { name: 'LFO pitch depth' }).focus()
    await user.keyboard('{PageUp}')
    await user.click(screen.getByRole('button', { name: 'Claim badge and continue' }))
    expect(screen.getByRole('heading', { name: /Save your sound/ })).toHaveFocus()
    for (const lesson of subtractiveLessons) expect(screen.getByText(new RegExp(`Badges:.*${lesson.reward}`))).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Tutorial progress' })).toHaveAttribute('value', '6')
    const patch = { ...usePatchStore.getState().values }
    await user.type(screen.getByRole('textbox', { name: 'Preset name' }), 'My quest pluck')
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Storage full', 'QuotaExceededError') })
    await user.click(screen.getByRole('button', { name: 'Save preset' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Storage full')
    expect(screen.getByRole('heading', { name: /Save your sound/ })).toBeInTheDocument()
    expect(screen.queryByText(/Patch builder badge earned/)).not.toBeInTheDocument()
    write.mockRestore()
    await user.click(screen.getByRole('button', { name: 'Save preset' }))
    expect(screen.getByText(/Patch builder badge earned! 700 XP/)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Voice / unison' })).toBeInTheDocument()
    expect(readWebSynthPresets()[0].values).toEqual(patch)
    expect(Object.keys(patch)).toHaveLength(webSynthParameters.length)
    unmount()
    usePatchStore.getState().resetValues()
    render(<App />)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Web synth preset' }), readWebSynthPresets()[0].id)
    expect(usePatchStore.getState().values).toEqual(patch)
  })

  it('can leave with the learning patch and restart without retaining XP', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Start tutorial' }))
    await user.click(within(screen.getByRole('group', { name: 'Oscillator 1 waveform' })).getByRole('radio', { name: 'Square' }))
    await user.click(screen.getByRole('button', { name: 'Claim badge and continue' }))
    await user.click(screen.getByRole('button', { name: 'Leave and keep patch' }))
    expect(usePatchStore.getState().values.osc1Wave).toBe(3)
    await user.click(screen.getByRole('button', { name: 'Start tutorial' }))
    expect(screen.getByRole('heading', { name: /Challenge 1/ })).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '0')
    await user.click(screen.getByRole('button', { name: 'Leave and restore previous patch' }))
    expect(usePatchStore.getState().values.osc1Wave).toBe(3)
  })

  it('shows storage errors without awarding a completion badge or destroying corrupted data', async () => {
    localStorage.setItem(webSynthPresetStorageKey, 'broken data')
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load presets')
    await user.type(screen.getByRole('textbox', { name: 'Preset name' }), 'Test')
    await user.click(screen.getByRole('button', { name: 'Save preset' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save preset')
    expect(screen.queryByText(/Saved "Test"/)).not.toBeInTheDocument()
    expect(localStorage.getItem(webSynthPresetStorageKey)).toBe('broken data')
  })

  it('keeps Summit controls and tutorial state separate when switching profiles', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Start tutorial' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Synth profile' }), 'summit')
    expect(screen.queryByRole('region', { name: 'Subtractive synthesis tutorial' })).not.toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Synth profile' }), 'web-synth')
    expect(screen.getByRole('button', { name: 'Start tutorial' })).toBeInTheDocument()
    expect(usePatchStore.getState().values).toEqual(tutorialInitialValues)
  })

  it('does not advance an unmet challenge when earlier controls change', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Start tutorial' }))
    act(() => usePatchStore.getState().setValue('osc1Wave', 2))
    await user.click(screen.getByRole('button', { name: 'Claim badge and continue' }))
    act(() => {
      usePatchStore.getState().setValue('osc2Level', 30)
      usePatchStore.getState().setValue('osc2Detune', 7)
      usePatchStore.getState().setValue('osc1Detune', 7)
    })
    expect(screen.getByRole('button', { name: 'Claim badge and continue' })).toBeDisabled()
  })
})
