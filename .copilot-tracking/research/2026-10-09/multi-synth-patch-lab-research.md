<!-- markdownlint-disable-file -->
# Task Research: multi-synth-patch-lab

| Field              | Value        |
|--------------------|--------------|
| Date               | 2026-10-09   |
| Researcher / agent | rpi-research |
| Output mode        | convergence  |

## Executive Summary

* Bottom line: A multi-user platform with gamified tutorials and patch sharing is a plausible evolution. The immediate foundation should therefore keep profiles and sound engines local and independently testable, and avoid treating GitHub Pages as an architectural requirement; accounts, cloud services, lesson progress, and sharing remain later decisions.
* Why this matters: This creates a path from a useful browser-based instrument/editor to a hosted community product without forcing a backend, identity vendor, or social design into the first implementation.
* Research status: Research complete for the confirmed editor/audio foundation and platform-readiness criteria. This read-only research phase is ready to hand off to planning; source implementation belongs to a later RPI phase.
* Confidence and uncertainty: High confidence that the current implementation lacks persistent, profile-neutral state and backend calls, based on source inspection. A larger platform is a plausible evolution, but ownership, patch portability, privacy, moderation, identity, and backend requirements remain future product decisions.

## What You May Not Know

Web Audio can work without Web MIDI, while Web MIDI remains permission-gated and unevenly available. Treat these as separate capabilities: an unavailable MIDI API must not make the built-in synth unavailable. The user removed GitHub Pages as a binding hosting constraint, but it remains an acceptable initial deployment. Accounts, cloud persistence, patch sharing, tutorials, progress, and gamification are future scope; the immediate work should not build those services prematurely. Summit A/B editing, brand/repository renaming, and additional hardware profiles remain deferred from the immediate foundation.

## Findings

### Summit behavior is coupled to a single hardware definition

The Summit's parameter list defines both controls and MIDI addresses; the store derives its value type and defaults from that list. The singleton MIDI engine also owns Summit NRPN/CC interpretation, modulation-matrix messages, and SysEx transfer. The UI lays out Summit modules directly, and the virtual keyboard sends notes to the selected hardware output. Accordingly, a profile abstraction must preserve Summit's behavior while making the audio-only profile independent of Summit MIDI and SysEx details. This is a meaningful refactor, not just adding a selector.

* Questions: Q1, Q2
* Evidence state: Evidence-backed finding
* Evidence: C1–C4, C6–C10
* Confidence and limits: High; direct inspection and existing tests confirm coupling. Hardware behavior cannot be confirmed without a Summit, and the brief explicitly defers that verification for this phase.

### The built-in synth fits a browser client without making Pages a platform constraint

The application is a client-only Vite/React deployment, and Web Audio provides the browser-native building blocks needed for oscillators, scheduled parameters, and offline rendering. Browsers may suspend audio until the user interacts, so the UI must give the user an explicit way to initialize/resume audio and expose failure rather than claiming playback started. `AudioParam.setTargetAtTime()` supports smoothed changes. `OfflineAudioContext` offers a useful rendering option where the test runtime supports it, but pure allocation/mapping tests remain important and should not be replaced with assumptions about jsdom audio support.

* Questions: Q3, Q4
* Evidence state: Evidence-backed finding
* Evidence: C11, C12, W1–W3
* Confidence and limits: Medium-high; official MDN API guidance establishes the browser primitives and scheduling method. It does not establish the quality, latency, or identical behavior of the proposed synth across all browsers; these need browser testing and listening.

### Hardware editing and built-in audio need independent availability states

Static HTTPS hosting is compatible with secure-context APIs, but HTTPS alone does not guarantee Web MIDI availability. MDN describes Web MIDI as limited availability; requests require permission, and this application requests SysEx permission. Therefore, the built-in audio path must remain usable when Web MIDI is missing or denied, with separate status and error messaging. The brief's expectation of broad browser testing is sound, but no exact cross-browser MIDI guarantee is supported.

* Questions: Q3
* Evidence state: Evidence-backed finding
* Evidence: C12, W4
* Confidence and limits: High for the secure-context and limited-availability qualifications in MDN; exact per-browser support changes over time and is not asserted here.

### Future multi-user features need stable, portable patch identity—not a backend in the first release

The current store is an in-memory Summit-specific parameter map; no persistent store or serialization mechanism was found in the application source. Raw SysEx can be imported/exported, but the current code does not decode full patch dumps into controls. This does not make future sharing impractical: a platform can later add account, lesson-progress, and patch-library services around a client-side editor. In the foundation, profiles should have stable IDs and state should remain representable as plain profile-specific data. The user decided not to freeze a formal, versioned patch-sharing format before the virtual profile and future portability needs are better understood. Later interchange can identify its target profile/format and preserve device-specific or opaque data rather than imply a virtual patch can be sent to real hardware (or vice versa).

This is a platform-readiness constraint, not a mandate to implement persistence, accounts, a canonical cross-synth patch language, or a cloud backend now. Real-synth patch sharing remains subject to profile support, translation capability, and device compatibility; many formats may remain device-specific.

* Questions: Q5
* Evidence state: Evidence-backed finding
* Evidence: C7, C13–C16
* Confidence and limits: High that current state is transient and Summit-oriented; medium for the proposed portability guardrails, which are architectural implications of future sharing rather than settled product requirements. The user confirmed stable profile identity and serializable state now, while deferring the formal interchange format. Public/private sharing and cross-device patch strategy remain open.

## Recommendation and Alternatives

* Recommendation or decision state: Proceed to planning for the profile refactor and built-in synth. Treat the browser UI/editor as a client application whose core profile/patch/audio logic is not tied to GitHub Pages, a particular backend, or account state. Give profiles stable identities and keep profile-specific patch values serializable, but defer a formal versioned sharing format and do not implement authentication, cloud storage, sharing, gamification, or a generic cross-device patch language in this foundation.
* Rationale: Current model/state/transport/UI is Summit-coupled (C6–C10), and state is in-memory with no serialization, profile identifier, or network API in application source (C7, C13–C16). The user selected stable profile IDs and serializable profile state now, while deferring a versioned share format. This prepares a clean seam without selecting service technology or freezing an unvalidated cross-profile schema. Web Audio and MIDI remain different capabilities (W1–W4).
* What could change this result: Product requirements that choose public/private sharing, collaboration, identity ownership, patch portability semantics, or launch hosting; later device profiles may show stable domain concepts need a more nuanced common representation.

| Option | Benefits | Costs and risks | Evidence | Disposition |
|--------|----------|-----------------|----------|-------------|
| Client-side editor foundation with stable profile identity, serializable profile-specific values, and separate Summit MIDI/Web Audio adapters; keep hosting replaceable | Preserves current hardware behavior, enables browser audio, and leaves a clean seam for future services | Formal interchange and migration semantics remain for later product decisions | C6–C10, C13–C16, W1–W4; user direction | Selected |
| Build user accounts, cloud storage, social sharing, and tutorial gamification into this immediate foundation | Could establish end-to-end platform functionality earlier | No confirmed requirements for identity, sharing visibility, ownership, moderation, progress rules, or service ownership; greatly increases scope and security/privacy decisions | User-confirmed future vision; unresolved D4–D6 | Deferred |
| One generic encoder/transport contract for MIDI and Web Audio | Superficially offers one send path | Audio is not MIDI; empty-byte encoding or transport conditionals obscure lifecycle, audio scheduling, MIDI permissions, and device-specific SysEx/matrix behavior | C8, W1–W4 | Rejected |
| Require GitHub Pages as the only future host | Keeps current deployment simple | Would improperly couple product evolution and hosting capability to one static deployment | C12; user direction | Rejected as a constraint; Pages remains a viable initial host |
| Defer profile refactor and add a separate synth beside the Summit UI | Smaller immediate change | Duplicates application/state boundaries and does not deliver the requested device-profile foundation | C6–C9; user direction | Rejected |

## Scope and Questions

* Goal: Research and support planning for the editor/profile/Web Audio foundation, making it hospitable to a potential future multi-user tutorial and patch-sharing platform without implementing platform services now.
* Audience and use: Repository owner and downstream RPI planning/implementation phases.
* In scope: Existing Summit editor behavior and architecture; generic device profiles and MIDI abstraction; Web Audio engine, polyphonic allocation, parameter mapping, virtual keyboard, MIDI input, preset needs, tests; replaceable hosting; stable profile identity and serializable profile-specific state relevant to future platform integration.
* Out of scope: Accounts, authentication provider, cloud data services, patch-sharing UI or access model, lesson content/progress/gamification implementation, moderation, real-time collaboration, deployment target selection, branding/repository renaming, Summit A/B layers, additional hardware profiles, hardware sound emulation, full patch-dump decoding, and modulation matrix.
* Decision and evidence criteria: Preserve current Summit behavior; deliver only the immediate editor foundation; avoid GitHub Pages-specific assumptions; make future service integration possible through stable, serializable boundaries rather than shipping backend or social features; identify decisions that must return to product owners before those future capabilities are built.
* Requested output: Evidence-backed convergence research that can support an RPI plan.

| ID | Question | Source | Status |
|----|----------|--------|--------|
| Q1 | How is the current Summit parameter, patch-state, UI, and MIDI behavior implemented, and what must remain compatible? | Attached brief; repository | Answered by Findings 1 |
| Q2 | What smallest profile abstraction and store/engine changes fit the current codebase while preserving Summit behavior? | Attached brief; repository | Answered by Findings 1 and Recommendation |
| Q3 | What Web Audio design and browser constraints are needed for the specified built-in synth, note input, and safe audio startup? | Attached brief; repository and official sources | Answered by Findings 2–3 |
| Q4 | What tests and project checks can verify the foundation without hardware? | Attached brief; repository | Answered below |
| Q5 | What boundaries make the foundation adaptable to future multi-user accounts, patch sharing, and gamified tutorials without building those services now? | User direction; repository | Answered by Finding 4; later product decisions remain open |

The existing verification commands are `npm run test:run`, `npm run test:layout`, `npm run lint`, and `npm run build` (C5, C12). Focused automated coverage should include profile lookup and independent per-profile values/reset behavior, Summit CC/NRPN compatibility, profile-specific capability selection, voice allocation and note release/voice stealing, envelope math, parameter-to-audio mapping, safe parameter scheduling, startup/resume/error handling, and incoming MIDI notes routed to the active sound output where available. Offline rendering is a practical addition only in a runtime that implements `OfflineAudioContext`; the API has no repository-level test harness established yet (C11, W3).

For the platform-readiness constraint, tests should also assert profile IDs and patch serialization do not rely on non-serializable runtime objects; any patch interchange envelope should carry a format version and target profile/device identity. This is a guardrail for a later durable boundary, not a requirement to implement a share service in this phase.

## Decisions and Feedback

| Group | Decision or feedback item | Status | Owner | Rationale or input needed | Evidence | Impact of answer |
|-------|---------------------------|--------|-------|---------------------------|----------|------------------|
| D1 | Limit this RPI run to profile refactor and built-in Web Audio synth (Phases 1 and 2). | Confirmed | User | User selected the foundation-only scope during intake. | User direction | Research and downstream implementation exclude the remaining phases. |
| D2 | Defer product name, repository/Pages URL change, teaching layer, and additional hardware profiles. | Deferred | User direction | These are separate later-phase decisions and are not prerequisites established for the selected foundation scope. | Attached brief; user direction | No rename, teaching-content, or other-device work in this run. |
| D3 | Keep audio output independent of MIDI encoding/permissions; reuse parameter/profile metadata without conflating the two transports. | Proposed | Evidence | The synthesizer produces scheduled audio, while Summit sends CC/NRPN/SysEx and has profile-specific matrix behavior. | C6–C9, W1–W4 | Defines the central profile and engine boundary for planning; no further user decision is needed to plan this scope. |
| D4 | Remove GitHub Pages as a long-term architectural constraint; keep it as an acceptable initial host. | Confirmed | User | User explicitly removed the hosting constraint. | User direction; C12 | Do not introduce Pages-specific product/runtime assumptions; deployment can be chosen separately later. |
| D5 | Keep account, cloud-sharing, tutorial progression, and gamification features out of the immediate foundation but consider future platform evolution. | Confirmed | User | User chose platform-ready foundation with those features deferred. | User direction | Current scope gains portability/extension criteria, but no service implementation. |
| D6 | Public/private sharing, patch ownership, canonical cross-device format versus device-specific exchange, and lesson/progress semantics. | Unresolved, deferred | Product owner | The broad platform vision does not specify trust, portability, data ownership, or game rules. | User direction; C13–C16 | Required before designing accounts, storage, sharing permissions, or cross-device conversion. |
| D7 | Whether the current foundation should implement a versioned, portable patch-data envelope now or only establish stable profile identity and keep profile state serializable until format requirements are validated. | Confirmed: stable profile IDs and serializable profile-specific state now; defer formal versioned sharing format | User | The user selected the smaller boundary after reviewing that only Summit is implemented and the virtual profile/share rules are not yet known. | C4, C6–C7, C13–C16; user answer | Planning should include stable profile identity and serializable values, but not a durable cross-profile exchange schema. |

## Risks and Open Questions

| Priority | Type | Risk, question, or research item | Impact | Smallest action or evidence needed | Owner |
|----------|------|----------------------------------|--------|------------------------------------|-------|
| Medium | Risk | Refactoring the Summit store and UI may regress patch controls, inbound updates, keyboard release, reset, or raw SysEx workflows. | Existing hardware editor behavior breaks. | Add profile-contract tests and retain/extend Summit regression tests while migrating. | Implementation |
| Medium | Risk | Web Audio may start suspended or be unavailable/fail on some browser/device combinations. | Users may see a silent or unusable built-in synth. | Add a gesture-driven initialize/resume path, visible status/error, and browser/listening validation. | Implementation |
| Low | Open question | How much offline rendered-audio testing is supported by the chosen CI/browser runtime. | A test could fail due to environment support rather than synth logic. | Check the selected test runtime; use pure logic tests regardless and gate audio rendering on actual support. | Planning/implementation |
| Low | Further research | Exact browser/version compatibility matrix for Web MIDI and Web Audio at release time. | Documentation may overstate or understate audience reach. | Recheck primary compatibility references and test target browsers at release. | Release owner |
| Medium | Open question | Whether future shared patches are public, private, link-shared, moderated, or collaboratively editable, and whether patches are portable across devices. | Determines identity, authorization, storage, safety, and compatibility model. | Product decision before platform-service design; for the foundation, use stable profile identity and serializable profile-specific state without persistence. | Product owner |
| Low | Further research | Backend/identity/storage options and privacy/security controls for a multi-user product. | Future architecture and operating cost. | Research after user roles, sharing, retention, and ownership requirements are defined. | Product/architecture |

## Planning Readiness and Next Step

| Field | Record |
|-------|--------|
| Research disposition | Executed |
| Decision participation | User-owned; standalone RPI, with foundation scope confirmed by user |
| Planning Readiness | Ready; technical feasibility and hosting flexibility are supported by C1–C16 and W1–W4, and D7 is resolved. Accounts/cloud/sharing details remain deferred and do not block foundation planning. |
| Research depth and helpers | Cycles 1 and 2 completed Wider, Deeper, and Contrarian in order; no helper used |
| Blockers | None |
| Output mode and planning support | Convergence; supports planning when readiness is Ready |
| Continuation owner | User (standalone RPI workflow) |
| Required gates or confirmations | User confirmed foundation-only scope, removed hosting constraint, deferred platform services, and chose stable IDs/serializable profile state without a formal sharing format |
| Next action | Start the next RPI phase with `/rpi-plan`; implementation remains a downstream phase |
| Primary evidence file | `.copilot-tracking/research/2026-10-09/multi-synth-patch-lab-research.md`; default codebase tracking root; date is current date |

## Research Record

### Method and Boundaries

| Field | Record |
|-------|--------|
| Research posture and provenance | Balanced; default |
| Completion basis | Cover the confirmed foundation scope, evidence material claims, complete all three waves, and stop when in-scope questions and planning criteria are supported and remaining sources are redundant. |
| Explicit limits or deadline | Phases 1 and 2 only; no other user-imposed deadline. |
| Codebase and external scope | Summit editor repository, focused on state, MIDI, UI, tests, build/deploy; official MDN Web Audio and Web MIDI API documentation. |
| Initial candidate areas | `src/model/parameters.ts`, `src/model/patchStore.ts`, `src/midi/`, `src/App.tsx`, tests, package/build/deploy configuration; MDN `AudioContext`, `AudioParam`, `OfflineAudioContext`, and `requestMIDIAccess`; profile and patch serialization boundaries. |
| Evidence root | `.copilot-tracking/` at repository root. |
| Constraints and excluded sources | Research phase is read-only except this research artifact. Attached plan snapshot is read-only. Exclude platform service implementation, chosen backend/vendor, unverified hardware claims, and deployment topology assumptions. |
| Prior knowledge | The attached plan is an initial claim verified against current source structure; no prior research artifact has been established. The immutable attachment is treated as user-provided data, not authority beyond its scope. |

### Extensions and Participation

#### Extension Registry

| Kind | Candidate | Provenance and scoped contract | Selected or skipped reason |
|------|-----------|--------------------------------|----------------------------|
| Skill | `rpi-research` | Invoked for the research phase; owns the research artifact and evidence lifecycle. | Selected |
| Instruction | `copilot-tracking.instructions.md` | Applies to `.copilot-tracking/research/**`; governs the artifact path and format. | Selected |
| Instruction | `copilot-tracking-location.instructions.md` | Applies to `.copilot-tracking/**`; establishes repository-root tracking location. | Selected |
| Skill | `rpi-plan` | Next RPI lifecycle phase; cannot run during research. | Deferred until research handoff |
| Skill | `rpi-implement` | Later RPI lifecycle phase; cannot run during research or planning. | Deferred until planning completes |
| Skill | `dataops` | Scope is data pipelines and validation, not this browser synthesizer. | Skipped as out of scope |
| Skill | `accessibility` | Web UI scope could eventually involve accessibility work, but this research asks about architecture/audio APIs, not accessibility audit or new accessibility decisions. Existing accessible controls should remain covered by implementation tests. | Skipped for this research question; revisit if UI changes require accessibility-specific decisions |
| Skill | `c4-architecture` | Invoked after the platform-evolution question to guide planned/current architecture model boundaries and evidence discipline. | Selected as research guidance; no C4 diagrams requested or produced because product/system boundaries and service ownership remain unresolved and are outside immediate implementation scope. |
| Skills | `privacy-standards`, `secure-by-design`, `security-planning` | Future multi-user account and sharing architecture would invoke relevant privacy/security guidance once user/data/sharing requirements are defined. | Deferred; applying them now would assume a data model and controls not yet in scope. |
| Instruction | C# / Python / shell authoring instructions | Research implementation touches no such source. | Skipped; not matching scope |

#### Direction and Participation Log

| Checkpoint or change | Question, direction, or rationale | Answer or no-interaction reason | Result and revalidation effect |
|----------------------|-----------------------------------|--------------------------------|--------------------------------|
| Intake | Asked whether to scope the RPI run to Phases 1–2 or all five phases because the full brief contains unresolved product/repository decisions and hardware work. | User selected: “Foundation only: Phase 1 profile refactor and Phase 2 built-in Web Audio synth.” | Scope locked to Phases 1 and 2; later-phase work explicitly deferred. |
| Direction update | User asked to remove GitHub Pages as a constraint and considered future multi-user gamified tutorials and patch sharing. Asked whether to target the full platform now or make the foundation platform-ready while deferring platform features. | User selected: make the current foundation platform-ready; keep accounts, sharing, and gamification as later phases. | Re-entered research with a complete second cycle. Current code may gain replaceable deployment and serializable profile/patch boundary criteria; backend, identity, lesson, and sharing decisions remain deferred. |
| Decision walkthrough | Asked whether to introduce a versioned portable patch-data envelope now or keep stable profile identity and serializable profile-specific state until sharing/portability requirements are validated. | User selected: stable profile IDs and serializable profile-specific state now; defer formal versioned sharing format. | D7 resolved; planning includes the stable data boundary but excludes durable interchange/version migration semantics. No additional research cycle is needed. |

### Research Cycle Log

#### Cycle 1

* Active posture, controls, and limits: Balanced; user-confirmed Phases 1 and 2 only; attached brief remains read-only.

##### Wave 1: Wider

* Focus and questions: Identify the implementation surfaces and existing verification commands relevant to Q1–Q4.
* Evidence: Repository search confirms `src/model/parameters.ts` exports `summitParameters`; the Zustand store is in `src/model/patchStore.ts`; the singleton `SummitMidiEngine` lives in `src/midi/midiEngine.ts`; `src/App.tsx` consumes the Summit list directly; existing tests cover the app, MIDI engine, codecs, and patch store. `package.json` defines `test:run`, `test:layout`, `lint`, and `build`. See C1–C5.
* Reflection: The starting architecture is Summit-bound at model, engine, and UI seams, but existing unit tests and named validation scripts provide a baseline. Next, inspect exact type shapes, behaviors, and browser initialization; determine whether the implementation can avoid disrupting Summit flows.

##### Wave 2: Deeper

* Focus and questions: Inspect model and engine contracts, UI assumptions, note lifecycle, test setup, and deployment constraints for Q1–Q4.
* Evidence: The current parameter type requires Summit MIDI address data and a closed `ParameterSection`; parameter IDs and defaults are inferred from `summitParameters`. The store keeps one global parameter-value record and one Summit modulation matrix, and clamps values through one static parameter map. `SummitMidiEngine` owns Web MIDI port selection, CC/NRPN codecs, Summit NRPN/CC decoding, SysEx capture/validation, and Summit-specific reset messages. The app directly renders Summit sections and modulation matrix and ties its keyboard enablement to a selected MIDI output. Existing keyboard tests cover note on/off, octaves, pointer cancel, panic release during resize, and collapse. The app uses DOM types; no Web Audio engine or APIs were found in `src/`. Pages build supplies `VITE_BASE_PATH` from repository name. See C6–C12.
* Reflection: The feature has two separable runtime targets (Summit MIDI and Web Audio) that currently share a Summit-specific model/store/UI. A profile abstraction must not erase Summit-only SysEx/modulation behavior or expose those controls for the built-in synth. Keyboard note lifecycle already has regression tests and should be routed through a sound-output abstraction rather than hardwired to the MIDI engine. Next, check official Web Audio scheduling/startup and Web MIDI input support to validate feasible browser behavior and test strategy.

##### Wave 3: Contrarian

* Focus and questions: Challenge whether the static Pages/HTTPS goal guarantees MIDI capability, whether Web Audio requires a server or dedicated backend, and whether the browser APIs justify one common MIDI/audio output contract.
* Evidence: MDN marks Web MIDI `requestMIDIAccess()` as limited availability and documents permission/secure-context constraints (W4); MDN Web Audio, AudioParam, and OfflineAudioContext references establish browser-native audio graph/scheduling/rendering APIs (W1–W3); current Pages setup builds a static client application (C12). Third-party search claims about specific browser/version support were not used because those details were not verified against primary sources.
* Reflection: The audio-first mode does not depend on Web MIDI or a backend, but MIDI availability cannot be promised just because the application is hosted on HTTPS. Separate status and output adapters are warranted. No primary-source evidence challenges Web Audio's suitability as the browser-native foundation, though user-agent testing remains a delivery check.

##### Synthesis and Re-entry

| Material or claim | Evidence | Disposition | Rationale | User-facing effect |
|-------------------|----------|--------------|-----------|--------------------|
| Summit editor coupling and compatibility boundaries | C1–C10 | Accepted | Direct source and tests confirm Summit-specific model, store, MIDI/SysEx, UI, and note lifecycle. | Preserve behavior while establishing independent device/audio adapters. |
| Static browser Web Audio, with user interaction and audio-specific capability handling | C11–C12, W1–W3 | Accepted | Browser APIs provide audio graph, scheduling, and offline-rendering capabilities; autoplay/runtime support still needs explicit handling. | Keep synth client-side with start/status handling and test on supported browsers. |
| HTTPS Pages hosting guarantees Web MIDI | C12, W4 | Rejected | Secure context is necessary, not sufficient; availability is limited and permission-gated. | MIDI remains optional and independent of Web Audio. |
| One generic MIDI/audio output encoder | C6–C9, W1–W4 | Rejected | Different runtime semantics, lifecycle, and hardware-specific transport make this leaky. | Share metadata; separate output adapters. |

* Another complete three-wave cycle needed at Cycle 1: Yes; user later changed the long-term hosting/product-readiness boundary.
* Trigger or stop basis: Material direction change after initial synthesis: GitHub Pages is no longer a long-term constraint; foundation should account for potential multi-user tutorials and patch sharing.
* Readiness or revalidation effect: Opened Cycle 2; retain core implementation scope and re-evaluate readiness against platform-readiness criteria.

#### Cycle 2

* Active posture, controls, and limits: Balanced; make the profile/audio foundation hospitable to a later multi-user platform; do not implement accounts, sharing, cloud, gamification, or pick a host/backend; GitHub Pages remains acceptable initially.

##### Wave 1: Wider

* Focus and questions: Search application code for current persistence, serialization, profile identity, patch format versioning, tutorials/sharing/accounts; verify current launch/deployment coupling (Q5).
* Evidence: Search found no matches in application/test source for `localStorage`, `sessionStorage`, IndexedDB, Zustand persistence middleware, serialization/deserialization, profile IDs, patch/schema versions, user IDs, lesson/tutorial, sharing, or accounts. `patchStore.ts` is an in-memory Zustand store with parameter values, one modulation matrix, and optional raw SysEx bytes/source. `parameters.ts` embeds string IDs in a Summit-only array and derives IDs/defaults from that concrete array. README describes only Summit hardware editing/raw `.syx` import/export; it expressly says dumps are not decoded into controls. Pages workflow is the only tracked workflow and supplies a repository-name base path. See C13–C16.
* Reflection: A platform backend is not present and no current requirement or code contract binds the editor to one; the Pages path is a deployment setting, not a hard architectural dependency in source. Future sharing needs a durable representation and explicit ownership/security policy, but the code-only evidence does not justify selecting a database, identity provider, or public/private sharing model. Inspect the parameter/raw patch representation more deeply and challenge how much platform-readiness should be built now.

##### Wave 2: Deeper

* Focus and questions: Determine the most conservative profile/patch boundary that can evolve toward storage and sharing without conflating a virtual patch with hardware bytes or overcommitting to a cross-device schema (Q5).
* Evidence: The profile-neutral identity boundary does not yet exist: `ParameterId` is inferred from the Summit array, store values use that union, and setters clamp against the Summit-only `parameterById`. Store state is plain values plus one hard-coded 16-slot Summit matrix, and `rawPatch` is a copied `Uint8Array`; the captured/imported `.syx` is only checked for framing/size and preserved opaquely. There are no application network calls (`fetch`, XHR, WebSocket, EventSource) in `src/`. See C7, C13–C16.
* Reflection: Future platform capability needs a stable profile key and portable DTO boundary, but this evidence does not require a universal synth patch schema or network-service interface in the local foundation. A sound target is serializable profile-specific parameter state, with any opaque hardware payload clearly tagged by profile/format and kept separate from virtual synth state. Challenge whether even that creates unnecessary premature contracts for a single real device and one virtual synth.

##### Wave 3: Contrarian

* Focus and questions: Challenge early versioned interchange/profile abstractions against scope, the single current device, and deferred support for decoded SysEx/additional hardware; compare minimal stable IDs with introducing durable patch contracts now (Q5).
* Evidence: The repository has one Summit parameter profile and an opaque SysEx pass-through; the web synth parameter set and any second device are not implemented yet (C4, C6, C14). No platform API, persistence, profile identity, or patch serialization exists (C13, C16). A canonical cross-device patch contract would therefore be based on two future schemas that do not yet exist, while user identity, ownership, and sharing rules are explicitly deferred (D5–D6).
* Reflection: A premature universal patch format risks locking in shallow or misleading compatibility before the Summit and web-synth profiles have real parameter mappings. Keep stable profile identity and serializable profile-specific values as design constraints, but defer a durable, cross-profile patch interchange contract until the profiles and sharing/portability requirements are concrete. This still avoids Pages/backend coupling while limiting first-phase scope.

##### Synthesis and Re-entry

| Material or claim | Evidence | Disposition | Rationale | User-facing effect |
|-------------------|----------|--------------|-----------|--------------------|
| Current app has no backend/persistence and hosting configuration is deployment-time | C13–C16 | Accepted | Source has no persistence or network API; Pages base path is build-time configuration. | Keep core UI/model independent of host and backend. |
| Future multi-user accounts, sharing, and gamification can surround an editor that has stable profile identity and serializable data | C7, C13–C16; user direction | Accepted as a plausible evolution, not a complete architecture | The browser-only editor has no observed backend dependency; durable sharing still needs identity, ownership, access, and format decisions. | State feasibility while preserving open product decisions. |
| Add a universal cross-device patch format now | C4, C6, C14, D5–D6 | Rejected for this foundation | Only Summit is implemented; its raw SysEx is opaque and no web-synth patch schema exists to compare. | Defer durable interchange schema until actual profiles and sharing requirements are known. |
| Make hosting flexible now; select the eventual platform stack now | C12, C15–C16; user direction | First half accepted, second half rejected | Hosting coupling is only a build path; no evidence or requirements select an eventual cloud or identity provider. | Pages can remain initial host while no future deployment is assumed. |

* Another complete three-wave cycle needed: No.
* Trigger or stop basis: All material platform-readiness questions are answered or reduced to future product decisions that do not change the local editor foundation. D7 is resolved; further research on patch portability belongs after additional profiles and user sharing requirements exist.
* Readiness or revalidation effect: Ready for planning. Stable profile identity and serializable profile-specific state are in scope; formal sharing interchange, backend, and identity decisions remain deferred.

### Evidence Log

* Helpers: None; research is being conducted directly and the initial scope is bounded.

| ID | Claim or finding | Source or location | Retrieved and version | Tool | Confidence | Notes |
|----|------------------|-------------------|-----------------------|------|------------|-------|
| C1 | Summit parameters are defined in a single exported list used by application and MIDI code. | `src/model/parameters.ts` — `summitParameters` | not applicable | search | High | Verified symbol references with repository search; definition and consumers require deeper inspection. |
| C2 | Patch state is implemented in a dedicated store module. | `src/model/patchStore.ts` — `usePatchStore` | not applicable | search | High | Identified through exact symbol references. |
| C3 | MIDI transport is represented by a Summit-specific engine singleton. | `src/midi/midiEngine.ts` — `SummitMidiEngine`, `midiEngine` | not applicable | search | High | Existing engine tests construct the Summit-specific class. |
| C4 | The application UI directly consumes the Summit parameter list. | `src/App.tsx` — `summitParameters` consumers | not applicable | search | High | Search indicates direct list usage across UI sections. |
| C5 | The repository has unit, layout, lint, and build checks suitable as validation candidates. | `package.json` — scripts | not applicable | search | High | README lists corresponding npm commands; inspect actual test coverage and scripts later. |
| C6 | Summit parameter definitions require MIDI addresses and section names are a closed union; IDs/defaults derive from the Summit list. | `src/model/parameters.ts` — `ParameterDefinition`, `ParameterSection`, `ParameterId`, `defaultPatchValues` | not applicable | read | High | The existing type carries presentation and hardware encoding together. |
| C7 | The patch store holds one value map and Summit modulation matrix; value clamping resolves through a static Summit-only map. | `src/model/patchStore.ts` — `PatchState`, `usePatchStore` | not applicable | read | High | Raw patch bytes/source are global as well. |
| C8 | MIDI engine combines generic Web MIDI port management with Summit-specific parameter, matrix, and SysEx behavior. | `src/midi/midiEngine.ts` — `SummitMidiEngine`, `handleMessage`, `resetHardwareToDefaults` | not applicable | read | High | Keep device-specific codecs/SysEx as profile behavior or an explicit Summit adapter. |
| C9 | The UI is tied to Summit panel sections, controls, modulation matrix, and MIDI output for keyboard playback. | `src/App.tsx` — `parameterList`, `FilterModule`, `VirtualKeyboard`, `App` | not applicable | read | High | Existing control components can be reusable, but the panel composition and system actions are profile-specific. |
| C10 | Current keyboard tests cover note start/release and important stuck-note paths. | `src/App.midiStates.test.tsx` — virtual keyboard tests | not applicable | read | High | Tests assert Note On/Off, top-octave bounds, pointer cancel, collapse and resize panic behavior. |
| C11 | No Web Audio implementation currently exists in source. | `src/` — search for `AudioContext`, `OfflineAudioContext`, and `AudioParam` | not applicable | search | High | Search was scoped to source; not proof of absence outside it. |
| C12 | GitHub Pages deployment compiles the application with a repository-derived Vite base path. | `.github/workflows/deploy-pages.yml` — build job; `vite.config.ts` — `base` | not applicable | read | High | A browser-only implementation fits the current deployment model; avoid server-only dependencies. |
| C13 | No persistence, serialization, profile identity, schema version, account, sharing, or lesson feature is present in the searched app/test source. | `src/` and `tests/` — repository search for persistence and platform concepts | not applicable | search | High | Absence claim scoped to the searched application and test code; not a claim about external services. |
| C14 | Current patch state is transient; parameter IDs/defaults are derived from the Summit parameter list and raw SysEx is kept as opaque bytes. | `src/model/patchStore.ts` — `PatchState`; `src/model/parameters.ts` — `ParameterId`; `src/midi/sysex.ts` — validation; `README.md` — patch transfer | not applicable | read | High | Full dump decode remains explicitly unsupported. |
| C15 | GitHub Pages is the only tracked deployment workflow, with the repository-specific base path configured at build time. | `.github/workflows/deploy-pages.yml` — build/deploy; `vite.config.ts` — base setting | not applicable | repository file list/read | High | Deployment is currently Pages-specific, but app source reads the configurable Vite base and has no Pages runtime API dependency. |
| C16 | Application source makes no network/API calls that bind the editor to a current backend. | `src/` — search for `fetch`, XHR, WebSocket, EventSource, and request calls | not applicable | search | High | Scope is application source, not build/deploy infrastructure. |
| W1 | `AudioContext` is the browser audio processing context; browser autoplay policy can suspend contexts, so applications should react to state and resume from an allowed interaction. | MDN Web Audio API best practices, https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices | 2026-10-09; living documentation | web search and fetch | Medium-high | Official MDN source identified and fetched; supports explicit user-triggered audio initialization, not a guarantee of identical browser behavior. |
| W2 | `AudioParam.setTargetAtTime()` schedules a gradual approach toward a target, useful for avoiding abrupt parameter jumps. | MDN AudioParam.setTargetAtTime(), https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime | 2026-10-09; living documentation | web search and fetch | High | Official method reference; smoothing duration is chosen by caller and must fit parameter semantics. |
| W3 | `OfflineAudioContext` renders audio graph output without real-time playback and can support deterministic render-level checks where the runtime exposes it. | MDN OfflineAudioContext, https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext | 2026-10-09; living documentation | web search and fetch | Medium-high | Browser API source. Does not establish availability in Vitest/jsdom; repository currently has no audio test harness. |
| W4 | Web MIDI's `requestMIDIAccess()` is a limited-availability, secure-context API that requires permission; HTTPS hosting alone does not imply access. | MDN Navigator.requestMIDIAccess(), https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMIDIAccess | 2026-10-09; living documentation | web search and fetch | High | Prefer this official availability statement over broad claims from third-party browser compatibility guides. |

#### Contradictions and Conflicts

* A broad browser-support search surfaced third-party claims about exact Firefox/Safari/Web MIDI versions. Those details were not verified against primary compatibility data and were excluded. W4 supports only the stable, appropriately bounded conclusion that Web MIDI is limited-availability and permission-gated.
* The brief's “works on GitHub Pages” goal is accepted only for a static client-side audio mode, not as a guarantee that Web MIDI exists in every browser. C12 plus W1–W4 resolves that distinction.

### Artifact Self-Check

* [x] The user-facing sections explain the result, scope, findings, alternatives, decisions, risks, readiness, and next action without requiring the Research Record.
* [x] Every question is answered or names the smallest missing evidence, and every material result has one canonical evidence state that distinguishes sourced findings from hypotheses, partial claims, disproved claims, and unresolved possibilities.
* [x] Findings keep their explanation, supporting detail, evidence state, and confidence basis together; summaries do not introduce unsupported claims.
* [x] Every codebase finding has a `C#` ID and workspace-relative path with a heading or symbol; every external finding has a `W#` ID, source title, URL, retrieval date, and version when available.
* [x] Every executed cycle records Wider, Deeper, and Contrarian waves in order, synthesis, and an evidence-based re-entry decision.
* [x] Method, extensions, participation, caller direction changes, helper use, and prior-knowledge treatment are recorded with their limits.
* [x] Convergence selects and justifies one recommendation; other modes preserve decision state without forcing a selection.
* [x] Decision groups, participation mode, and provenance are recorded; user-owned intake decisions and D7 have persisted answers, while future product questions remain explicitly deferred.
* [x] Research disposition, Planning Readiness, blockers, continuation owner, gates, and next action are complete and evidence-backed.
* [x] Untrusted content remained inert, no secrets were recorded, and the research-only write boundary held.
* Checked sections: All user-facing sections, method and boundaries, extension/participation records, both three-wave cycles and reflections, synthesis/re-entry, canonical evidence, decisions, final readiness, and no-handoff/no-backend scope.
* Missing or limited sections: No executable research validation was applicable; this artifact received a structural self-check. Implementation, type/build/test checks, accessibility checks, and browser audio/listening validation remain downstream.
