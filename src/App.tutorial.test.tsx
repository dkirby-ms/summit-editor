import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { usePatchStore } from './model/patchStore'
import { webSynthDefaultValues, webSynthParameters } from './model/webSynthProfile'
import { subtractiveLessons, tutorialDismissedStorageKey, tutorialInitialValues, tutorialSaveLesson } from './model/subtractiveTutorial'
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

  it('accepts exact keyboard values, rejects invalid edits, and keeps sliders synchronized', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Edit oscillator 1 filter cutoff value:/ }))
    let cutoff = screen.getByRole('spinbutton', { name: 'Oscillator 1 filter cutoff value' })
    expect(cutoff).toHaveFocus()
    await user.clear(cutoff)
    await user.type(cutoff, '1500{Enter}')
    expect(usePatchStore.getState().values.filterCutoff).toBe(1500)
    expect(screen.getByRole('slider', { name: 'Oscillator 1 filter cutoff' })).toHaveAttribute('aria-valuenow', '1500')
    await user.click(screen.getByRole('button', { name: /^Edit oscillator 1 filter cutoff value:/ }))
    cutoff = screen.getByRole('spinbutton', { name: 'Oscillator 1 filter cutoff value' })
    await user.clear(cutoff)
    await user.type(cutoff, '12001{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a whole number from 100 to 12000')
    expect(cutoff).toHaveAttribute('aria-invalid', 'true')
    expect(usePatchStore.getState().values.filterCutoff).toBe(1500)
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: /^Edit oscillator 1 filter cutoff value:/ })).toHaveTextContent('1500 Hz')
    await user.click(screen.getByRole('button', { name: /^Edit oscillator 1 filter cutoff value:/ }))
    cutoff = screen.getByRole('spinbutton', { name: 'Oscillator 1 filter cutoff value' })
    await user.clear(cutoff)
    await user.keyboard('{Enter}')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: /^Edit oscillator 2 detune value:/ }))
    const detune = screen.getByRole('spinbutton', { name: 'Oscillator 2 detune value' })
    await user.clear(detune)
    await user.type(detune, '-7')
    await user.tab()
    expect(usePatchStore.getState().values.osc2Detune).toBe(-7)
    await user.click(screen.getByRole('button', { name: /^Edit amplifier attack value:/ }))
    const attack = screen.getByRole('spinbutton', { name: 'Amplifier attack value' })
    await user.clear(attack)
    await user.type(attack, '25{Enter}')
    expect(screen.getByRole('slider', { name: 'Amplifier attack' })).toHaveValue('25')
    fireEvent.change(screen.getByRole('slider', { name: 'Amplifier attack' }), { target: { value: '50' } })
    expect(screen.getByRole('button', { name: /^Edit amplifier attack value:/ })).toHaveTextContent('50 ms')
    await user.click(screen.getByRole('button', { name: /^Edit amplifier attack value:/ }))
    await user.keyboard('{Control>}a{/Control}{Delete}')
    expect(usePatchStore.getState().values.ampAttack).toBe(50)
    await user.keyboard('{Escape}')
  })

  it('displays real envelope durations while editing milliseconds and sustain percentages', async () => {
    const user = userEvent.setup()
    render(<App />)
    for (const prefix of ['Amplifier', 'Filter']) {
      for (const [stage, maximum] of Object.entries({ attack: 20000, decay: 22000, release: 30000 })) {
        const slider = screen.getByRole('slider', { name: `${prefix} ${stage}` })
        expect(slider).toHaveAttribute('max', String(maximum))
        fireEvent.change(slider, { target: { value: String(maximum) } })
        expect(slider).toHaveAttribute('aria-valuetext', `${maximum / 1000} s`)
        const button = screen.getByRole('button', { name: new RegExp(`^Edit ${prefix.toLowerCase()} ${stage} value:`) })
        expect(button).toHaveTextContent(`${maximum / 1000} s`)
        await user.click(button)
        const input = screen.getByRole('spinbutton', { name: `${prefix} ${stage} value` })
        expect(input).toHaveValue(maximum)
        expect(input).toHaveAttribute('aria-description', expect.stringContaining('milliseconds'))
        expect(screen.getByText('Milliseconds (ms)')).toBeVisible()
        await user.clear(input)
        await user.type(input, '1500{Enter}')
        expect(slider).toHaveValue('1500')
        expect(slider).toHaveAttribute('aria-valuetext', '1.5 s')
        fireEvent.change(slider, { target: { value: '999' } })
        expect(slider).toHaveAttribute('aria-valuetext', '999 ms')
        fireEvent.keyDown(slider, { key: 'Delete' })
      }
      const sustain = screen.getByRole('slider', { name: `${prefix} sustain` })
      expect(sustain).toHaveAttribute('max', '100')
      fireEvent.change(sustain, { target: { value: '100' } })
      expect(sustain).toHaveAttribute('aria-valuetext', '100%')
    }
  })

  it('presents every challenge with structured actions, listening guidance, an accessible sketch, and a current step', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Start tutorial' }))
    const tutorial = within(screen.getByRole('region', { name: 'Subtractive synthesis tutorial' }))
    const targets: Readonly<Record<string, number>>[] = [
      { osc1Wave: 2 },
      { osc2Level: 30, osc2Detune: 7 },
      { filterCutoff: 1500, filter2Cutoff: 1500, filterResonance: 20, filter2Resonance: 20 },
      { ampAttack: 15, ampDecay: 350, ampSustain: 30, ampRelease: 500 },
      { filterEnvelopeAmount: 40, filterAttack: 10, filterDecay: 600, filterSustain: 20 },
      { lfoRate: 4, lfoPitchDepth: 10 },
    ]
    for (const [step, lesson] of [...subtractiveLessons, tutorialSaveLesson].entries()) {
      for (const heading of ['Learn', 'See the idea', 'Try it', 'Listen for']) {
        expect(tutorial.getByRole('heading', { name: heading, level: 4 })).toBeInTheDocument()
      }
      expect(tutorial.getByText(lesson.takeaway)).toBeInTheDocument()
      expect(tutorial.getByText(lesson.listen)).toBeInTheDocument()
      for (const action of lesson.challenge) expect(tutorial.getByText(action).tagName).toBe('LI')
      expect(tutorial.getByRole('img')).toHaveAccessibleDescription(lesson.visualCaption)
      expect(tutorial.getByRole('img')).toHaveAccessibleName()
      const steps = within(tutorial.getByRole('list', { name: 'Tutorial steps' })).getAllByRole('listitem')
      expect(steps).toHaveLength(7)
      expect(steps[step]).toHaveAttribute('aria-current', 'step')
      expect(steps.filter((item) => item.hasAttribute('aria-current'))).toHaveLength(1)
      if (step < targets.length) {
        act(() => usePatchStore.getState().applyProfileValues('web-synth', { ...usePatchStore.getState().values, ...targets[step] }))
        await user.click(tutorial.getByRole('button', { name: 'Claim badge and continue' }))
      }
    }
  })

  it('shows labeled harmonic spectra instead of the placeholder sketch', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Start tutorial' }))
    const diagram = screen.getByRole('img', { name: /Harmonic spectra/ })
    expect(diagram).toHaveAccessibleDescription(subtractiveLessons[0].visualCaption)
    expect(within(diagram).getByText('Sine')).toBeInTheDocument()
    expect(within(diagram).getByText('Sawtooth')).toBeInTheDocument()
    expect(within(diagram).getAllByText('Relative strength')).toHaveLength(2)
    const spectra = diagram.querySelectorAll('.harmonic-spectrum')
    expect(spectra).toHaveLength(2)
    for (const [index, spectrum] of [...spectra].entries()) {
      const bars = spectrum.querySelectorAll<HTMLElement>('.harmonic-bar')
      expect(bars).toHaveLength(8)
      for (const [harmonic, bar] of [...bars].entries()) {
        const expected = index === 0 && harmonic > 0 ? 0 : 100 / (harmonic + 1)
        expect(parseFloat(bar.style.height)).toBeCloseTo(expected)
      }
      expect(spectrum.querySelectorAll('.harmonic-tick')).toHaveLength(8)
    }
    expect(screen.queryByText(/Concept sketch, not a live audio measurement/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Top: Sine/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Bottom: Sawtooth/)).not.toBeInTheDocument()
  })

  it('is opt-in, hides locked controls from keyboard access, and exits with the current patch', async () => {
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
    const learningPatch = { ...usePatchStore.getState().values }
    await user.click(screen.getByRole('button', { name: 'Exit tutorial' }))
    expect(usePatchStore.getState().values).toEqual(learningPatch)
    expect(localStorage.getItem(tutorialDismissedStorageKey)).toBe('true')
    expect(screen.queryByRole('heading', { name: 'Learn subtractive synthesis' })).not.toBeInTheDocument()
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
    expect(localStorage.getItem(tutorialDismissedStorageKey)).toBe('true')
    expect(screen.queryByRole('heading', { name: 'Learn subtractive synthesis' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Skip tutorial' })).not.toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Web synth preset' }), readWebSynthPresets()[0].id)
    expect(usePatchStore.getState().values).toEqual(patch)
  })

  it('can leave with the learning patch and restart without retaining XP', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Start tutorial' }))
    await user.click(within(screen.getByRole('group', { name: 'Oscillator 1 waveform' })).getByRole('radio', { name: 'Square' }))
    await user.click(screen.getByRole('button', { name: 'Claim badge and continue' }))
    await user.click(screen.getByRole('button', { name: 'Exit tutorial' }))
    expect(usePatchStore.getState().values.osc1Wave).toBe(3)
    await user.click(screen.getByRole('button', { name: 'Start tutorial' }))
    expect(screen.getByRole('heading', { name: /Challenge 1/ })).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '0')
    await user.click(screen.getByRole('button', { name: 'Exit tutorial' }))
    expect(usePatchStore.getState().values.osc1Wave).toBe(tutorialInitialValues.osc1Wave)
  })

  it('remembers skipping across remounts without changing the patch and allows replay', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.click(screen.getByRole('button', { name: 'Skip tutorial' }))
    expect(screen.getByRole('button', { name: 'Start tutorial' })).toHaveFocus()
    expect(usePatchStore.getState().values).toEqual(webSynthDefaultValues)
    unmount()
    render(<App />)
    expect(screen.queryByRole('heading', { name: 'Learn subtractive synthesis' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Skip tutorial' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Voice / unison' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Start tutorial' }))
    expect(screen.getByRole('heading', { name: /Challenge 1/ })).toBeInTheDocument()
  })

  it('remembers exiting across profile changes and remounts', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.click(screen.getByRole('button', { name: 'Start tutorial' }))
    await user.click(screen.getByRole('button', { name: 'Exit tutorial' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Synth profile' }), 'summit')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Synth profile' }), 'web-synth')
    expect(screen.queryByRole('button', { name: 'Skip tutorial' })).not.toBeInTheDocument()
    unmount()
    render(<App />)
    expect(screen.queryByRole('heading', { name: 'Learn subtractive synthesis' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start tutorial' })).toBeInTheDocument()
  })

  it('exits even if storage fails and explains that the preference could not be remembered', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Start tutorial' }))
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Storage full', 'QuotaExceededError') })
    await user.click(screen.getByRole('button', { name: 'Exit tutorial' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Could not remember tutorial preference: Storage full')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Voice / unison' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start tutorial' })).toHaveFocus()
  })

  it('reports preference read failures while keeping the tutorial optional', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === tutorialDismissedStorageKey) throw new DOMException('Storage blocked', 'SecurityError')
      return null
    })
    render(<App />)
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load tutorial preference: Storage blocked')
    expect(screen.getByRole('button', { name: 'Skip tutorial' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Voice / unison' })).toBeInTheDocument()
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
