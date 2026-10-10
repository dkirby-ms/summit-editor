import { useId } from 'react'
import type { TutorialLesson } from './model/subtractiveTutorial'

type ExplainerLesson = Pick<TutorialLesson, 'takeaway' | 'concept' | 'challenge' | 'listen' | 'visual' | 'visualCaption'>

function ConceptSketch({ lesson }: { lesson: ExplainerLesson }) {
  const id = useId()
  if (lesson.visual === 'harmonics') {
    return (
      <figure className="tutorial-visual">
        <h4>See the idea</h4>
        <div className="harmonic-comparison" role="img" aria-label="Harmonic spectra: Sine has one frequency; Sawtooth has a series of harmonics" aria-describedby={`${id}-description`}>
          {(['Sine', 'Sawtooth'] as const).map((waveform) => (
            <div className="harmonic-spectrum" key={waveform}>
              <div className="harmonic-spectrum-heading">
                <div><strong>{waveform}</strong><span>{waveform === 'Sine' ? 'One frequency' : 'Many harmonics'}</span></div>
                <svg viewBox="0 0 80 32" aria-hidden="true">
                  <path className="sketch-signal" d={waveform === 'Sine'
                    ? 'M 2 16 Q 11 -8 20 16 T 38 16 T 56 16 T 74 16'
                    : 'M 2 28 L 20 4 V 28 L 38 4 V 28 L 56 4 V 28 L 74 4'} />
                </svg>
              </div>
              <span className="harmonic-axis-label">Relative strength</span>
              <div className="harmonic-plot">
                {Array.from({ length: 8 }, (_, index) => {
                  const harmonic = index + 1
                  const strength = waveform === 'Sine' && harmonic > 1 ? 0 : 100 / harmonic
                  return (
                    <div className="harmonic-column" key={harmonic}>
                      <div className="harmonic-bar-track">
                        <span className="harmonic-bar" style={{ height: `${strength}%` }} />
                      </div>
                      <span className="harmonic-tick">{harmonic}f</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          <p className="harmonic-frequency-label">Frequency →</p>
          <p className="harmonic-key"><strong>1f</strong> = the note you play. <strong>2f–8f</strong> = higher multiples of that frequency.</p>
        </div>
        <figcaption id={`${id}-description`}>{lesson.visualCaption}</figcaption>
      </figure>
    )
  }
  const envelope = lesson.visual === 'amplitude' || lesson.visual === 'brightness'
  const labels = {
    blend: ['Top: Oscillator 1', 'Bottom: Oscillator 2, slightly detuned'],
    filter: ['Low frequencies pass', 'Above cutoff: reduced'],
    amplitude: ['Attack / Decay / Sustain / Release', 'Loudness over time'],
    brightness: ['Attack / Decay / Sustain / Release', 'Cutoff above its base over time'],
    vibrato: ['Rate = speed', 'Depth = distance from original pitch'],
    preset: ['Sound settings', 'One saved recipe'],
  }[lesson.visual]
  return (
    <figure className="tutorial-visual">
      <h4>See the idea</h4>
      <svg viewBox="0 0 320 160" role="img" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
        <title id={`${id}-title`}>{labels.join('. ')}</title>
        <desc id={`${id}-description`}>{lesson.visualCaption}</desc>
        {lesson.visual === 'blend' && <>
          <path className="sketch-axis" d="M 12 40 H 308 M 12 120 H 308" />
          <path className="sketch-signal" d="M 12 40 Q 30 0 48 40 T 84 40 T 120 40 T 156 40 T 192 40 T 228 40 T 264 40 T 300 40" />
          <path className="sketch-secondary" d="M 12 120 Q 29 80 46 120 T 80 120 T 114 120 T 148 120 T 182 120 T 216 120 T 250 120 T 284 120 T 318 120" />
        </>}
        {lesson.visual === 'filter' && <>
          <path className="sketch-axis" d="M 12 145 H 308 M 12 145 V 12" />
          {[85, 76, 68, 60, 52, 44, 36, 28].map((height, index) =>
            <path key={index} className="sketch-secondary" d={`M ${35 + index * 36} 145 v ${-height}`} />)}
          <path className="sketch-signal" d="M 15 58 H 140 Q 157 58 166 35 Q 176 8 190 58 Q 210 130 305 137" />
          <path className="sketch-marker" d="M 190 12 V 145" />
        </>}
        {envelope && <>
          <path className="sketch-axis" d="M 12 140 H 308 M 12 140 V 12" />
          <path className="sketch-marker" d="M 24 12 V 140 M 230 12 V 140" />
          <path className="sketch-signal" d="M 24 140 L 65 20 L 135 100 H 230 L 298 140" />
        </>}
        {lesson.visual === 'vibrato' && <>
          <path className="sketch-marker" d="M 12 80 H 308" />
          <path className="sketch-signal" d="M 12 80 Q 36 10 60 80 T 108 80 T 156 80 T 204 80 T 252 80 T 300 80" />
          <path className="sketch-secondary" d="M 36 45 H 84 M 36 40 V 50 M 84 40 V 50 M 308 45 V 80 M 303 45 H 313 M 303 80 H 313" />
        </>}
        {lesson.visual === 'preset' && <>
          {[20, 60, 100].map((y) => <g key={y}>
            <rect className="sketch-box" x="16" y={y} width="100" height="24" rx="4" />
            <path className="sketch-secondary" d={`M 28 ${y + 12} H 102 M 56 ${y + 6} V ${y + 18}`} />
          </g>)}
          <path className="sketch-signal" d="M 124 72 H 190 M 178 60 L 190 72 L 178 84" />
          <rect className="sketch-box" x="212" y="25" width="88" height="112" rx="6" />
          <path className="sketch-secondary" d="M 232 45 H 280 M 232 65 H 280 M 232 85 H 280 M 232 105 H 262" />
        </>}
      </svg>
      <div className="tutorial-visual-labels">
        {labels.map((label) => <span key={label}>{label}</span>)}
      </div>
      {envelope && <div className="tutorial-visual-labels"><span>Key-down: start</span><span>Key-up: release begins</span></div>}
      {lesson.visual === 'filter' && <p className="tutorial-sketch-note">Dashed marker: cutoff. Bump: resonance.</p>}
      <figcaption>{lesson.visualCaption}</figcaption>
    </figure>
  )
}

/** Pairs an original, static concept diagram with instructions and an audible comparison. */
export function TutorialExplainer({ lesson }: { lesson: ExplainerLesson }) {
  return (
    <div className="tutorial-lesson-grid">
      <section className="tutorial-learn">
        <h4>Learn</h4>
        <p className="tutorial-takeaway">{lesson.takeaway}</p>
        <p>{lesson.concept}</p>
      </section>
      <ConceptSketch lesson={lesson} />
      <div className="tutorial-lesson-copy">
        <section className="tutorial-challenge">
          <h4>Try it</h4>
          <ol>{lesson.challenge.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol>
        </section>
        <section className="tutorial-listen">
          <h4>Listen for</h4>
          <p>{lesson.listen}</p>
          <p className="tutorial-play-hint">Start audio above and play the keyboard below. Listening is optional.</p>
        </section>
      </div>
    </div>
  )
}
