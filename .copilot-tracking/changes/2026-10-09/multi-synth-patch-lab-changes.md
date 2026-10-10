<!-- markdownlint-disable-file -->
# RPI Changes: Multi-synth patch lab foundation

## Metadata

* Task ID: multi-synth-patch-lab
* Related plan: [multi-synth-patch-lab-plan.md](../../plans/2026-10-09/multi-synth-patch-lab-plan.md)
* Implementation date: 2026-10-09

<!-- Wrap code, commands, and symbols in backticks. Link existing files and folders with the workspace-relative path as the link text and a path relative to this file as the destination; repository files are three levels up. Keep a not-yet-created path in backticks. -->

## Execution Status

* Status: Complete for bounded task `P02-T02`
* Declared invocation scope: `P02-T02`, implementing accepted review finding RV-003
* Completed scope markers: `P02-T02`
* All remaining active-plan markers: `P02`; the containing phase marker remains unchecked because this invocation was task-bounded
* Status basis: Retired voices now remove all three shared-LFO modulation routes. Repeated lifecycle regression coverage and the full test, layout, lint, and build checks passed.

## Execution Summary

Prior work completed `P01` and `P02`, including Summit input isolation, computer-keyboard piano operation, Summit-styled Web Synth controls, and full-plan validation. This invocation completed bounded task `P02-T02` by removing stale LFO routes and verifying they remain bounded across repeated voice lifecycles.

## Completed Work

### Stable synth profile and parameter contracts

* Related phase or task: `P01-T01`
* Files:
  * [src/model/parameters.ts](../../../src/model/parameters.ts)
  * [src/model/profiles.ts](../../../src/model/profiles.ts)
  * [src/model/profiles.test.ts](../../../src/model/profiles.test.ts)
  * [src/midi/codec.ts](../../../src/midi/codec.ts)
  * [src/midi/midiEngine.ts](../../../src/midi/midiEngine.ts)
  * [src/App.tsx](../../../src/App.tsx)
* Behavior or functionality changed: Parameter presentation and value metadata no longer inherently require hardware MIDI addresses. Summit retains a distinct hardware-typed definition, and a stable-ID local profile registry now declares its defaults and capabilities, reserving the built-in web-synth identifier for the next phase.
* Validation: Targeted profile, codec, MIDI-engine, and Summit-app tests passed (4 files, 36 tests); editor diagnostics reported no errors.

### Profile-specific serializable patch state

* Related phase or task: `P01-T02`
* Files:
  * [src/model/patchStore.ts](../../../src/model/patchStore.ts)
  * [src/model/patchStore.test.ts](../../../src/model/patchStore.test.ts)
  * [src/App.tsx](../../../src/App.tsx)
  * [src/App.test.tsx](../../../src/App.test.tsx)
  * [src/midi/midiEngine.ts](../../../src/midi/midiEngine.ts)
  * [src/midi/midiEngine.test.ts](../../../src/midi/midiEngine.test.ts)
* Behavior or functionality changed: Patch values are stored by stable profile ID and restored independently when switching profiles; defaults, clamping, and reset use the selected profile. Summit matrix and copied opaque SysEx data now live under Summit-specific state and do not become generic profile values.
* Validation: Store, MIDI-engine, Summit app, and keyboard regression tests passed (4 files, 38 tests); changed-file diagnostics reported no errors.

### Summit hardware protocol remains profile-specific

* Related phase or task: `P01-T03`
* Files:
  * [src/midi/summitMidiAdapter.ts](../../../src/midi/summitMidiAdapter.ts)
  * [src/midi/summitMidiAdapter.test.ts](../../../src/midi/summitMidiAdapter.test.ts)
  * [src/midi/midiEngine.ts](../../../src/midi/midiEngine.ts)
  * [src/midi/midiEngine.test.ts](../../../src/midi/midiEngine.test.ts)
* Behavior or functionality changed: Summit parameter encoding, inbound CC/NRPN reflection, matrix handling, reset, SysEx validation/transfer, and edit-buffer requests are owned by a Summit-identified adapter; the engine continues to manage Web MIDI access, ports, channel, and note transport.
* Validation: Profile/store/codec/engine/adapter/Summit app/keyboard regressions passed (7 files, 50 tests); changed-file diagnostics reported no errors.

### Active synth profile selection preserves the Summit launch experience

* Related phase or task: `P01-T04`
* Files:
  * [src/App.tsx](../../../src/App.tsx)
  * [src/App.css](../../../src/App.css)
  * [src/App.test.tsx](../../../src/App.test.tsx)
* Behavior or functionality changed: The application exposes its registered synth profile through an accessible selector, uses stable profile IDs for selection, and gates hardware-specific connection, patch-transfer, and keyboard surfaces by profile capability. Summit remains selected initially and retains its existing editor composition.
* Validation: Summit app/keyboard/store/MIDI regression tests passed (4 files, 38 tests); `npm run test:layout` passed (10 checks across desktop and mobile dimensions); changed-file diagnostics reported no errors.

### Built-in Web Audio profile and complete presets

* Related phase or task: `P02-T01`
* Files:
  * [src/model/webSynthProfile.ts](../../../src/model/webSynthProfile.ts)
  * [src/model/profiles.ts](../../../src/model/profiles.ts)
  * [src/model/profiles.test.ts](../../../src/model/profiles.test.ts)
  * [src/model/patchStore.ts](../../../src/model/patchStore.ts)
  * [src/model/patchStore.test.ts](../../../src/model/patchStore.test.ts)
  * [src/App.tsx](../../../src/App.tsx)
  * [src/App.test.tsx](../../../src/App.test.tsx)
* Behavior or functionality changed: A stable `web-synth` profile is selectable alongside Summit and owns independent address-free controls, defaults, audio/MIDI capabilities, and three complete presets. Full profile value sets can now be applied atomically with range validation; selecting the web profile no longer displays Summit controls.
* Validation: At this task's completion, profile, store, and app tests passed (3 files, 30 tests); changed-file diagnostics reported no errors.

### Bounded polyphonic Web Audio engine and modulation

* Related phase or task: `P02-T02`
* Files:
  * [src/audio/voiceAllocator.ts](../../../src/audio/voiceAllocator.ts)
  * [src/audio/voiceAllocator.test.ts](../../../src/audio/voiceAllocator.test.ts)
  * [src/audio/envelope.ts](../../../src/audio/envelope.ts)
  * [src/audio/envelope.test.ts](../../../src/audio/envelope.test.ts)
  * [src/audio/webAudioSynth.ts](../../../src/audio/webAudioSynth.ts)
  * [src/audio/webAudioSynth.test.ts](../../../src/audio/webAudioSynth.test.ts)
  * [src/midi/codec.ts](../../../src/midi/codec.ts)
  * [src/midi/summitMidiAdapter.ts](../../../src/midi/summitMidiAdapter.ts)
* Behavior or functionality changed: The built-in synth lazily resumes audio on explicit start, reports initialization status/errors independently, and allocates at most eight voices with deterministic stealing. Each voice uses two selected oscillators, a low-pass filter, independent amp/filter ADSRs, and the shared pitch/filter LFO. Note release holds the current scheduled envelope value before ramping; panic uses a short release and filter and amplifier release times remain independent. Retiring a voice also removes its three incoming LFO modulation routes so repeated notes do not retain historical voice nodes.
* Validation: The focused Web Audio engine test passed (1 file, 5 tests), including three simultaneous voices, partial/full release, and five repeated note lifecycles with zero stale modulation routes after cleanup. `npm run test:run` passed (10 files, 73 tests); `npm run test:layout` passed (10 checks); `npm run lint` and `npm run build` passed.

### Profile-aware Web Audio controls and performance routing

* Related phase or task: `P02-T03`
* Files:
  * [src/App.tsx](../../../src/App.tsx)
  * [src/App.css](../../../src/App.css)
  * [src/App.test.tsx](../../../src/App.test.tsx)
  * [src/midi/midiEngine.ts](../../../src/midi/midiEngine.ts)
  * [src/midi/midiEngine.test.ts](../../../src/midi/midiEngine.test.ts)
  * [src/audio/webAudioSynth.ts](../../../src/audio/webAudioSynth.ts)
* Behavior or functionality changed: The web profile now renders all synth controls and complete presets, applies edits to the audio engine, and requires an explicit Start/Resume audio interaction before enabling its keyboard. The shared keyboard routes note-on/off, panic, cancellation, collapse, and resize cleanup to the selected profile output. Optional Web MIDI input publishes channel-filtered note events (including zero-velocity note-off and panic) to that output, while Web-synth MIDI access does not request SysEx privilege; audio and MIDI statuses remain separate. Resetting the web profile no longer sends Summit hardware defaults.
* Validation: Focused application/audio/MIDI coverage passed (50 tests across 6 files); at that checkpoint the full suite had 69 tests. Layout, lint, default build, and configured non-root build passed. Chromium exercised the production build at `/preview/` with no failed requests: audio reached `ready` after the explicit button gesture, controls changed, keyboard note-on/off and panic paths were triggered, and simulated MIDI permission denial left audio ready and the keyboard enabled. The user confirmed sound works; detailed subjective timbre and release quality were not assessed.

### Full-suite and hosting-independent validation

* Related phase or task: `P02-T04`
* Files:
  * [package.json](../../../package.json)
  * [vite.config.ts](../../../vite.config.ts)
  * [tests/layout.mjs](../../../tests/layout.mjs)
* Behavior or functionality changed: No production behavior changed; final validation exercised the completed feature against existing checks and both root and configured non-root deployment paths.
* Validation: `npm run test:run` passed (10 files, 69 tests); `npm run test:layout` passed (10 checks); `npm run lint` passed; `npm run build` passed with the default root base and with `VITE_BASE_PATH=/preview/`. Chromium loaded the non-root production build, exercised Web Audio startup, parameter editing, keyboard note lifecycle, and panic, and verified simulated MIDI permission denial did not disable audio; all app asset requests succeeded. The user confirmed that the synth produces sound. Detailed subjective assessment of timbre and release quality was not recorded.

### Summit MIDI feedback remains isolated by profile

* Related phase or task: `P01-T03`
* Files:
  * [src/model/patchStore.ts](../../../src/model/patchStore.ts)
  * [src/model/patchStore.test.ts](../../../src/model/patchStore.test.ts)
  * [src/midi/summitMidiAdapter.ts](../../../src/midi/summitMidiAdapter.ts)
  * [src/midi/summitMidiAdapter.test.ts](../../../src/midi/summitMidiAdapter.test.ts)
* Behavior or functionality changed: Incoming Summit parameter feedback now updates Summit-owned values even when another profile is active, without mutating the visible Web Synth values. Matrix and SysEx state remain Summit-specific.
* Validation: `npm run test:run -- src/model/patchStore.test.ts src/midi/codec.test.ts src/midi/midiEngine.test.ts src/midi/summitMidiAdapter.test.ts src/App.test.tsx` passed (5 files, 52 tests).

### Active-profile isolation remains covered after Summit feedback

* Related phase or task: `P01-T04`
* Files:
  * [src/App.test.tsx](../../../src/App.test.tsx)
  * [src/model/patchStore.test.ts](../../../src/model/patchStore.test.ts)
* Behavior or functionality changed: Tests now verify that Summit feedback received while Web Synth is selected is retained under Summit, leaves the active Web Synth parameter unchanged, and is restored when Summit is selected again.
* Validation: The same focused five-file regression command passed (52 tests).

### Web Synth uses Summit-style rotary and ADSR controls

* Related phase or task: `P02-T03`
* Files:
  * [src/App.tsx](../../../src/App.tsx)
  * [src/App.css](../../../src/App.css)
  * [src/App.test.tsx](../../../src/App.test.tsx)
* Behavior or functionality changed: Continuous Web Synth settings now use the same accessible rotary interaction and visual dial as Summit. Amplifier and filter ADSRs each display the shared envelope graph and four labeled vertical sliders, scaled to their own parameter ranges; discrete waveform choices remain selects. Web Synth piano buttons now start notes on Enter/Space and release on key-up or focus loss.
* Validation: `npm run test:run -- src/App.test.tsx` passed (25 tests), covering rotary semantics/keyboard adjustment, envelope graphs and vertical sliders, preset/control updates, and keyboard note start/release. `npm run test:layout` passed (10 checks).

## Implementation-Time Plan Updates

### Reopen voice lifecycle task for RV-003

* Affected plan area or markers: `P02`, `P02-T02`, NFR-004
* What changed: Reopened `P02-T02` and its containing `P02` marker for accepted review finding RV-003. The bounded task is now checked complete; the containing phase marker remains unchecked because it was outside this invocation's scope.
* Why: Review evidence found that retiring a voice did not remove its shared-LFO source connections, which is within the existing voice-lifecycle and resource-safety acceptance boundary.
* Triggering evidence: [multi-synth-patch-lab-review-2.md](../../reviews/logs/2026-10-10/multi-synth-patch-lab-review-2.md), finding RV-003 and accepted route RD-004.
* User answer or decision: User accepted the proposed implementation route before this invocation.
* Reconciliation performed: Updated current task/phase checklist markers and planning readiness. No requirements, design, dependencies, scope, or diagrams changed.
* Planning and critique state: Existing plan remains implementation-ready for this bounded task; no new critique was run.

### Confirmed Web Synth controls and accepted review routes

* Affected plan area or markers: `FR-003`, `FR-008`, `P01-T03`, `P01-T04`, `P02-T03`, `P02-T04`
* What changed: Reopened affected tasks. Recorded that Summit feedback must remain isolated to Summit state, virtual piano keys must support computer-keyboard note start/release, and Web Synth continuous controls must use Summit-style rotary encoders while amp/filter ADSRs use the Summit graph with vertical sliders.
* Why: The user confirmed the desired Web Synth presentation; RV-001 and RV-002 were accepted for implementation in the review decision record.
* Triggering evidence: Web Synth currently uses horizontal range inputs for continuous controls and envelopes; Summit already provides accessible rotary interaction and ADSR graph/vertical-slider patterns. RV-001 identifies missing keyboard operation; RV-002 identifies cross-profile MIDI reflection.
* User answer or decision: User confirmed the rotary-encoder and ADSR/vertical-slider presentation on 2026-10-10, and accepted both review findings for `rpi-implement`.
* Reconciliation performed: Added FR-008; clarified Summit-state isolation in FR-003; updated task requirements, reopened affected task/phase markers, and refreshed readiness and execution state. No phase/task topology changed, so diagrams remain structurally accurate.
* Planning and critique state: PC-001 remains resolved; no new critique was run. The user-confirmed requirement and accepted review findings have been implemented.

### Profile registry contract for dependent tasks

* Affected plan area or markers: `P01-T02`, `P01-T03`, `P01-T04`
* What changed: Added task-local `Guidance:` pointers to the new profile registry and generic/Summit parameter types.
* Why: Later state, MIDI, and UI work should use the new typed profile seam rather than rediscovering or conflating profile-neutral and hardware-specific metadata.
* Triggering evidence: `P01-T01` introduced `SynthProfile`, stable profile IDs/capabilities, and separate `ParameterDefinition`/`SummitParameterDefinition` contracts.
* User answer or decision: None; implementation-only annotation.
* Reconciliation performed: Updated dependency-ready task Guidance blocks; no requirement, design, dependency, marker, or diagram change.
* Planning and critique state: Plan remains implementation-ready; PC-001 remains resolved.

### Summit MIDI adapter handoff

* Affected plan area or markers: `P01-T04`
* What changed: Added a task-local `Guidance:` pointer to the Summit MIDI adapter and generic port/note transport boundary.
* Why: The profile-selection UI must continue routing Summit-only operations through the adapter while keeping MIDI lifecycle distinct from future Web Audio output.
* Triggering evidence: `P01-T03` extracted Summit protocol and patch-transfer behavior into `SummitMidiAdapter`.
* User answer or decision: None; implementation-only annotation.
* Reconciliation performed: Updated `P01-T04` Guidance; no requirement, design, dependency, marker, or diagram change.
* Planning and critique state: Plan remains implementation-ready; PC-001 remains resolved.

### Web-synth schema and preset handoff

* Affected plan area or markers: `P02-T02`, `P02-T03`
* What changed: Added task-local Guidance pointers to the web-synth parameter schema and complete preset/state-application API.
* Why: Audio parameter mapping and UI controls need stable concrete paths to the typed ranges, defaults, and profile-aware state replacement.
* Triggering evidence: `P02-T01` added `webSynthParameters`, `webSynthPresets`, `webSynthProfile`, and `applyProfileValues`.
* User answer or decision: None; implementation-only annotation.
* Reconciliation performed: Updated later task Guidance; no requirements, design, dependencies, markers, or diagrams changed.
* Planning and critique state: Plan remains implementation-ready; PC-001 remains resolved.

## Validation Record

| Check | Scope | Status | Evidence or reason |
|-------|-------|--------|--------------------|
| `npm run test:run -- src/audio/webAudioSynth.test.ts` | `P02-T02` / RV-003 | Passed | 1 file, 5 tests; the regression verifies routes track active voices through partial release, full release, and repeated note lifecycles. |
| `npm run test:run` | `P02-T02` / RV-003 | Passed | Full suite: 10 files, 73 tests. |
| `npm run test:layout` | `P02-T02` / RV-003 | Passed | 10 responsive-layout and interaction checks. |
| `npm run lint` | `P02-T02` / RV-003 | Passed | ESLint completed without errors. |
| `npm run build` | `P02-T02` / RV-003 | Passed | TypeScript project build and Vite production build completed. |
| `npm run test:run` | Full plan | Passed | 10 test files, 72 tests passed after accepted review findings and the control-design update. |
| Targeted profile and Summit regressions | `P01-T01` | Passed | `npm run test:run -- src/model/profiles.test.ts src/midi/codec.test.ts src/midi/midiEngine.test.ts src/App.test.tsx`; 4 files, 36 tests passed. |
| Editor diagnostics | `P01-T01` | Passed | No errors in the changed TypeScript/TSX files. |
| Targeted profile, state, MIDI adapter, and Summit regressions | `P01-T03` | Passed | `npm run test:run -- src/model/profiles.test.ts src/model/patchStore.test.ts src/midi/codec.test.ts src/midi/midiEngine.test.ts src/midi/summitMidiAdapter.test.ts src/App.test.tsx src/App.midiStates.test.tsx`; 7 files, 50 tests passed. |
| Editor diagnostics | `P01-T03` | Passed | No errors in the changed TypeScript/TSX files. |
| Targeted web-synth profile, state, and selection tests | `P02-T01` | Passed | `npm run test:run -- src/model/profiles.test.ts src/model/patchStore.test.ts src/App.test.tsx`; 3 files, 30 tests passed. |
| Editor diagnostics | `P02-T01` | Passed | No errors in the changed TypeScript/TSX files. |
| `npm run test:layout` | Full plan | Passed | 10 responsive-layout and interaction checks passed across desktop and mobile viewports. |
| `npm run lint` | `P02-T03` | Passed | `npm run lint` passed after wiring Web Audio controls, input routing, and shared keyboard cleanup. |
| `npm run build` | Full plan | Passed | Default root build and `VITE_BASE_PATH=/preview/ npm run build` both passed. |
| Browser audio and MIDI-independent operation | Full plan | Passed | Chromium verified explicit gesture startup to audio `ready`, control edits, keyboard note-on/off, panic, and audio/keyboard availability after simulated MIDI denial. The user confirmed that sound works; detailed subjective assessment of timbre and release quality was not recorded. |
| Root and configured non-root base paths | Full plan | Passed | Root layout suite passed; Chromium loaded the configured `/preview/` production build with no failed asset requests. |

## Pre-Review Reconciliation

* Plan markers and task-local context: All task markers are checked. `P02` remains unchecked because this invocation was bounded to `P02-T02`; `P01` remains complete.
* Completed-work entries and handoff prose: The RV-003 cleanup and regression evidence are recorded with the prior implementation history; the user confirmed the synth produces sound.
* Validation, blockers, remaining work, and follow-up items: Full suite (73 tests), layout (10 checks), lint, build, and focused LFO-routing lifecycle checks passed. No blockers remain; only the out-of-scope `P02` phase marker and previously recorded optional follow-ups remain.
* Review readiness: Ready for optional follow-up Review of the implemented RV-003 route; user-confirmed sound output remains recorded, and detailed timbre/release assessment is optional.

## Blockers

None.

## Remaining Work

The `P02` phase marker remains unchecked outside the bounded `P02-T02` invocation; all `P02` task markers are checked.

## Follow-Up Items

* Canonical plan list: [multi-synth-patch-lab-plan.md](../../plans/2026-10-09/multi-synth-patch-lab-plan.md), `## Follow-Up Items`
* Optionally assess timbre and release quality by ear; the user has confirmed that sound works, and automated/browser checks cover parameter updates and note lifecycle.
* Define multi-user account, identity, patch ownership, privacy, storage, sharing, lesson, progress, and moderation requirements before planning platform services.
* Reassess versioned patch interchange and cross-profile conversion after Summit and web-synth patch representations exist.
* Add additional hardware profiles only with validated mappings and evidence.
* Revisit branding, repository name, and deployment target separately from architecture.

## Return-to-Caller State

* Implementation execution status: Complete for bounded task `P02-T02`; successful audio output is confirmed by the user.
* Declared scope and markers: `P02-T02` / RV-003 is complete. The `P02` phase marker remains unchecked because the invocation was task-bounded; all task markers are checked.
* Validation coverage: RV-003 focused regression passed; full suite (73 tests), layout (10 checks), lint, and root production build passed. Earlier full-plan profile/Summit/UI/audio tests, non-root build, and Chromium interaction/MIDI-denial checks remain recorded above. The user confirmed sound output; detailed subjective timbre/release quality is not assessed.
* Blockers: None.
* Current plan updates: Reopened then completed `P02-T02` for RV-003; no requirement, design, scope, dependency, or diagram changes.
* Planning and critique state: Implementation is complete; initial standard critique finding PC-001 is resolved.
* Follow-up items: Multi-user platform services, formal patch interchange, additional hardware profiles, and branding/deployment decisions remain deferred.
* Review readiness or no-handoff reason: Ready for optional follow-up Review of RV-003 implementation evidence; no re-review was run automatically.
* Continuation owner: User (standalone RPI workflow).
