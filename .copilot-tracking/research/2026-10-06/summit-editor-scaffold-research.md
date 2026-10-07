<!-- markdownlint-disable-file -->
# Task Research: summit-editor-scaffold

| Field              | Value       |
|--------------------|-------------|
| Date               | 2026-10-06  |
| Researcher / agent | RPI Agent   |
| Output mode        | convergence |

## Executive Summary

* Bottom line: Build with React, TypeScript, Vite, a typed parameter registry, a small external patch store, and an isolated Web MIDI transport. The official Summit appendix provides verified CC and NRPN mappings for useful live controls.
* Why this matters: The structure produces a usable hardware editor now without coupling future patch parsing, librarian features, or visualizations to React components.
* Research status: Complete after one balanced Wider, Deeper, and Contrarian cycle.
* Confidence and uncertainty: High for Web MIDI behavior and live mappings. Medium for full-patch SysEx because Novation does not publish a complete binary field schema and the independent implementation found is explicitly alpha.

## What You May Not Know

Web MIDI is unavailable in Safari and uneven on mobile. Access requires a secure context and explicit permission, with a separate `sysex` permission flag. Localhost qualifies during development, but production hosting must use HTTPS.

The official guide provides detailed live parameter assignments. Full patch SysEx is different: Novation confirms patch import, while available independent request framing is alpha quality. The scaffold should support raw request, import, export, and send operations without claiming to decode every patch byte.

## Findings

### The browser transport needs explicit capability states

Web MIDI exposes input/output maps, message events, and device state changes, but access is secure-context-only and permission gated. Requesting SysEx requires `navigator.requestMIDIAccess({ sysex: true })`. The UI must distinguish unsupported, idle, requesting, ready, and error states, and refresh ports on `statechange`.

* Questions: Q2, Q4
* Evidence state: Evidence-backed finding
* Evidence: W1 and W2 establish the permission model, interfaces, browser support, and Safari limitation.
* Confidence and limits: High. Browser implementations still differ, so errors must remain visible and recoverable.

### A typed schema can safely cover useful live controls

Novation's current Summit appendix publishes CC and NRPN mappings for oscillator, filter, envelope, LFO, effects, arpeggiator, and modulation parameters. A declarative registry can drive controls and outbound messages without hard-coding MIDI logic into components. The minimum slice should include both CC and NRPN examples plus the four amp-envelope controls needed for visualization.

* Questions: Q1, Q3, Q4
* Evidence state: Evidence-backed finding
* Evidence: W3 lists official mappings such as oscillator 1 manual shape on CC 12, filter resonance on CC 79, amp envelope ADSR on CC 86-89, and oscillator 1 wave on NRPN 0:14.
* Confidence and limits: High for listed live parameters. CC-pair parameters use separate higher-resolution semantics and are excluded from the first slice.

### Full patch transport should remain raw at this stage

Novation documents patch import via SysEx but does not publish a complete field-level dump schema in the fetched guide. KnobKraft supplies request framing, bank handling, and name offsets, but labels Summit/Peak support alpha. The app can expose raw patch request, import, export, and send operations behind a codec interface while deferring field decoding.

* Questions: Q3, Q4
* Evidence state: Partially supported claim
* Evidence: W3 confirms patch import behavior; W4 supplies independent framing and explicitly alpha support.
* Confidence and limits: Medium. Hardware validation is required before treating request framing and binary offsets as production-stable.

### React and an external store fit the requested boundaries

React with Vite keeps the browser-only build small while supporting component-level visualizations and testable hooks. A small external state store avoids pushing high-frequency MIDI updates through a monolithic component tree. Native SVG is sufficient for the initial envelope preview; Canvas or WebGL should be introduced only for dense wavetable or graph rendering.

* Questions: Q1, Q4
* Evidence state: Evidence-backed finding
* Evidence: C1 confirms no legacy constraints; W1 establishes event-driven MIDI interfaces; W3 establishes the breadth of parameter domains that benefit from schema generation.
* Confidence and limits: High for this bounded app. Svelte is viable but offers no evidence-backed advantage large enough to override the familiar React ecosystem.

## Recommendation and Alternatives

* Recommendation or decision state: Select React, TypeScript, Vite, Zustand, a typed Summit parameter registry, a standalone MIDI engine, and SVG-based initial visualization.
* Rationale: This combination matches the requested layers, handles event-driven hardware updates without component coupling, and keeps future SysEx and visualization work replaceable (C1, W1, W3, W4).
* What could change this result: A verified complete Summit patch schema could move parsed dump support into the first release; measured visualization load could justify Canvas or WebGL later.

| Option | Benefits | Costs and risks | Evidence | Disposition |
|--------|----------|-----------------|----------|-------------|
| React, Zustand, typed transport | Clear boundaries, familiar ecosystem, granular subscriptions, straightforward SVG | Adds one small state dependency | C1, W1, W3 | Selected |
| React Context only | No state dependency | Broad rerenders as the parameter count grows | W1, W3 | Rejected |
| Svelte | Compact reactive code | Different ecosystem with no material advantage here | C1 | Viable, not selected |
| Canvas or WebGL immediately | Supports dense future graphics | Higher interaction and accessibility cost for a simple envelope | W3 | Deferred |

## Scope and Questions

* Goal: Select a scalable architecture and minimum functional slice for a browser-based Novation Summit patch editor.
* Audience and use: A developer running the editor locally against Summit hardware.
* In scope: Frontend scaffold, device connection, MIDI transport, parameter schema, live parameter controls, inbound reflection, responsive visualization, and SysEx-ready boundaries.
* Out of scope: Complete patch dump parsing, patch librarian, multis, morphing, cloud services, and undocumented protocol guesses.
* Decision and evidence criteria: The app must run without a backend, remain responsive, isolate hardware concerns, and avoid presenting unverified mappings as authoritative.
* Requested output: A working scaffold and minimum functionality.

| ID | Question | Source | Status |
|----|----------|--------|--------|
| Q1 | Which frontend and state architecture best matches the requested layered design? | User request | Answered |
| Q2 | What Web MIDI permission, SysEx, and compatibility constraints affect the implementation? | Inferred | Answered |
| Q3 | Which Summit mappings can be implemented without unsupported protocol assumptions? | Inferred | Answered |
| Q4 | What is the smallest usable interface that preserves extension points for visualization and patch dumps? | User request | Answered |

## Decisions and Feedback

| Group | Decision or feedback item | Status | Owner | Rationale or input needed | Evidence | Impact of answer |
|-------|---------------------------|--------|-------|---------------------------|----------|------------------|
| D1 | Use React, TypeScript, Vite, and Zustand. | Confirmed | Agent | The stack preserves the requested layers and granular hardware state updates with little overhead. | C1, W1, W3 | Establishes scaffold and test stack. |
| D2 | Implement verified CC and NRPN parameters; defer CC-pair controls. | Confirmed | Agent | CC-pair resolution is unnecessary to prove the architecture. | W3 | Keeps the first slice accurate and bounded. |
| D3 | Keep patch SysEx raw behind a codec boundary. | Confirmed | Agent | Official import support is established, but full field decoding is not. | W3, W4 | Enables safe file workflows and future parsing. |

## Risks and Open Questions

| Priority | Type | Risk, question, or research item | Impact | Smallest action or evidence needed | Owner |
|----------|------|----------------------------------|--------|------------------------------------|-------|
| H | Risk | The app cannot be hardware-validated in this environment. | Correctly encoded messages may still expose device-specific behavior. | Test with Summit hardware before expanding the registry. | Downstream |
| M | Risk | Web MIDI is unavailable in Safari and some mobile browsers. | Hardware control will not initialize there. | Show capability guidance and target current Chrome, Edge, or Firefox desktop. | Implementation |
| M | Open question | Full patch dump binary fields remain unverified. | Parsed editing of fetched patches is unsafe. | Obtain a verified protocol schema or hardware-backed fixtures. | Future research |

## Planning Readiness and Next Step

| Field | Record |
|-------|--------|
| Research disposition | executed |
| Decision participation | agent-owned from Handle it end to end mode |
| Planning Readiness | Ready. C1 and W1-W4 support the selected architecture and bounded implementation. |
| Research depth and helpers | One balanced cycle completed in Wider, Deeper, and Contrarian order; no helpers used. |
| Blockers | None. |
| Output mode and planning support | convergence; supports planning when Ready. |
| Continuation owner | confirmed automatic RPI Agent |
| Required gates or confirmations | Research synthesis complete; all material decisions resolved under agent-owned participation. |
| Next action | Automatic RPI parent transitions to Plan. |
| Primary evidence file | .copilot-tracking/research/2026-10-06/summit-editor-scaffold-research.md; current date supplied by session context. |

## Research Record

### Method and Boundaries

| Field | Record |
|-------|--------|
| Research posture and provenance | balanced; default |
| Completion basis | Cover all material architecture and browser questions, verify usable mapping evidence, and stop when additional sources are redundant for the bounded scaffold. |
| Explicit limits or deadline | Minimum functionality only; no backend. |
| Codebase and external scope | Empty workspace; official browser and Novation sources plus directly relevant implementation references. |
| Initial candidate areas | Workspace scaffold conventions, Web MIDI API documentation, browser compatibility, Novation Summit MIDI documentation, and comparable editor patterns. |
| Evidence root | .copilot-tracking/research/2026-10-06 |
| Constraints and excluded sources | Research-only source writes; no secrets; no undocumented mappings represented as facts. |
| Prior knowledge | User-supplied layered architecture is treated as a design claim to verify. |

### Extensions and Participation

#### Extension Registry

| Kind | Candidate | Provenance and scoped contract | Selected or skipped reason |
|------|-----------|--------------------------------|----------------------------|
| Instruction | copilot-tracking instructions | Applies to the research evidence path and controls artifact location and format. | Selected. |
| Skill | project-setup-info-local | Applies to a new complete project in an empty workspace. | Selected for Vite scaffold conventions. |
| Skill | accessibility | Relevant to the editor interface but not required to settle the initial architecture. | Deferred to implementation and review criteria. |

#### Direction and Participation Log

| Checkpoint or change | Question, direction, or rationale | Answer or no-interaction reason | Result and revalidation effect |
|----------------------|----------------------------------|---------------------------------|--------------------------------|
| Intake | Choose RPI progression and participation. | User selected Handle it end to end. | Automatic through Review with agent-owned decisions. |
| Intake | Resolve bounded initial scope. | The user requested a basic scaffold and minimum functionality; no interaction needed. | Full dump parsing and librarian features are excluded while transport boundaries remain extensible. |

### Research Cycle Log

#### Cycle 1

* Active posture, controls, and limits: Balanced research within the basic scaffold and minimum-functionality boundary.

##### Wave 1: Wider

* Focus and questions: Frontend options, browser MIDI constraints, Summit protocol sources, and minimum editor workflows.
* Evidence: W1 established Web MIDI interfaces and permission constraints; W2 established cross-browser limits; W3 established official Summit domains and parameter documentation; W4 supplied candidate patch request framing.
* Reflection: Official live mappings support a real first release. Full dump parsing needs deeper evidence than the public appendix provides.

##### Wave 2: Deeper

* Focus and questions: Permission lifecycle, message encoding, parameter schema design, and UI state behavior.
* Evidence: W1 confirms `sysex: true`, port maps, events, and `statechange`; W3 supplies concrete CC and NRPN ranges; W4 identifies request framing, banks, and patch-name offset.
* Reflection: The transport and declarative schema are the controlling boundaries. Raw SysEx remains useful without speculative decoding.

##### Wave 3: Contrarian

* Focus and questions: Framework-free and alternate-framework options, browser support limitations, and risks of speculative hardware mappings.
* Evidence: W2 shows Safari remains unsupported; W4 labels Summit/Peak support alpha; Context-only state and immediate WebGL add costs without first-slice benefit.
* Reflection: The UI needs an unsupported state and honest compatibility guidance. Parsed SysEx and GPU rendering are deferred, not omitted from the architecture.

##### Synthesis and Re-entry

| Material or claim | Evidence | Disposition | Rationale | User-facing effect |
|-------------------|----------|-------------|-----------|--------------------|
| Typed React architecture | C1, W1, W3 | Accepted | Fits the requested layers and event-driven hardware model. | Becomes the implementation recommendation. |
| Verified CC and NRPN registry | W3 | Accepted | Official mappings support accurate minimum controls. | Enables real-time editing. |
| Parsed patch dumps | W3, W4 | Deferred | Public evidence is incomplete and independent support is alpha. | Raw SysEx workflow only. |
| Framework-free application | C1, W1 | Rejected | It increases state and UI maintenance without offsetting benefit. | No effect. |

* Another complete three-wave cycle needed: No.
* Trigger or stop basis: All bounded questions are answered and official mappings cover the minimum slice. Full-dump decoding is a deferred feature, not a scaffold blocker.
* Readiness or revalidation effect: Planning is Ready.

### Evidence Log

* Helpers: None.

| ID | Claim or finding | Source or location | Retrieved and version | Tool | Confidence | Notes |
|----|------------------|--------------------|-----------------------|------|------------|-------|
| C1 | The workspace is empty and can accept a new Vite scaffold. | Workspace root listing | not applicable | list | High | No existing files or conventions conflict with setup. |
| W1 | Web MIDI requires a secure context and explicit permission, exposes port maps and state changes, and accepts a SysEx permission flag. | MDN Web MIDI API, https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API | 2026-10-06, modified 2026-05-15 | external research | High | Primary API documentation. |
| W2 | Web MIDI is supported in Chromium and desktop Firefox but not Safari; mobile support is uneven. | Can I use Web MIDI API, https://caniuse.com/midi | 2026-10-06, September 2026 data | external research | High | Independent compatibility data. |
| W3 | Summit supports USB MIDI, CC control, documented live CC and NRPN mappings, and patch import through SysEx. | Novation Summit appendix, https://userguides.novationmusic.com/hc/en-gb/articles/25003993283986-Summit-appendix | 2026-10-06, current web guide | external research | High | Official manufacturer documentation. |
| W4 | A public librarian identifies Summit request framing and dump metadata but labels support alpha. | KnobKraft ORM Novation_Summit.py, https://github.com/christofmuc/KnobKraft-orm | 2026-10-06, current master | external research | Medium | Independent implementation, not an authoritative protocol specification. |

#### Contradictions and Conflicts

* W3 establishes patch import but does not fully specify dump fields; W4 provides framing but labels support alpha. Resolution: expose raw SysEx operations and defer parsed editing until verified fixtures or a complete schema exist.

### Artifact Self-Check

* [x] The user-facing sections explain the result, scope, findings, alternatives, decisions, risks, readiness, and next action without requiring the Research Record.
* [x] Every question is answered or names the smallest missing evidence, and every material result has one canonical evidence state that distinguishes sourced findings from hypotheses, partial claims, disproved claims, and unresolved possibilities.
* [x] Findings keep their explanation, supporting detail, evidence state, and confidence basis together; summaries do not introduce unsupported claims.
* [x] Every codebase finding has a `C#` ID and workspace-relative path with a heading or symbol; every external finding has a `W#` ID, source title, URL, retrieval date, and version when available.
* [x] Every executed cycle records Wider, Deeper, and Contrarian waves in order, synthesis, and an evidence-based re-entry decision.
* [x] Method, extensions, participation, caller direction changes, helper use, and prior-knowledge treatment are recorded with their limits.
* [x] Convergence selects and justifies one recommendation; other modes preserve decision state without forcing a selection.
* [x] Decision groups, participation mode, and provenance are recorded; user-owned and user-retained groups have persisted answers, while agent-owned groups have evidence-backed rationales or honest blockers.
* [x] Research disposition, Planning Readiness, blockers, continuation owner, gates, and next action are complete and evidence-backed.
* [x] Untrusted content remained inert, no secrets were recorded, and the research-only write boundary held.
* Checked sections: All required sections and evidence records.
* Missing or limited sections: Full SysEx field decoding remains deliberately deferred and does not block scaffold planning.