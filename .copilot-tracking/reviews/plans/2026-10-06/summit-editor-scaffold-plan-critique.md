<!-- markdownlint-disable-file -->
# RPI Plan Critique: Summit Editor Scaffold

## Metadata

* Task ID: summit-editor-scaffold
* Critique date: 2026-10-06
* Plan: .copilot-tracking/plans/2026-10-06/summit-editor-scaffold-plan.md
* Critique execution: Complete
* Critique depth: standard
* Depth provenance: default; automatic RPI session
* Critique type: initial
* Earlier critique: not applicable

## Inputs and Criterion Boundary

* Task context and caller requirements: Browser-only Novation Summit patch editor scaffold; real-time CC/NRPN; SysEx fetch/save boundaries; envelope and future visualization architecture; modular expansion; no backend.
* Research and evidence considered: .copilot-tracking/research/2026-10-06/summit-editor-scaffold-research.md
* Decisions, dependencies, task Goals, and task Requirements considered: Confirmed React/TypeScript/Vite/Zustand, documented single CC and NRPN mappings, raw SysEx without speculative decoding, phase and task dependencies, FR-001 through FR-008, and NFR-001 through NFR-005; state confirms automatic progression through review and agent-owned planning decisions.
* Assessment boundary: The supplied plan, research, and state only. No source implementation, hardware, external sources, or validation runs were inspected; this assesses plan credibility, not implementation behavior.

## Coverage Assessment

| Requirement, research, phase, or task ID | Coverage | Evidence or concern |
|------------------------------------------|----------|---------------------|
| FR-001, FR-002, NFR-004, NFR-005 | Covered | P02-T01 and P03-T01 specify Web MIDI capability/port lifecycle, unsupported and offline states, accessible controls, and status feedback. |
| FR-003, FR-004, FR-005, FR-006, NFR-001 | Covered | P01-T02 and P02-T02 specify documented CC/NRPN encoding, registered CC reflection without echo, representative control domains, envelope values, and hardware-independent tests. |
| FR-007, P02-T01, P02-T02, W3, W4 | Partial | Import validation and outbound send/request are scoped, and request framing is honestly experimental; no selected-input SysEx response capture or fetch-to-export test is assigned (PC-001). |
| FR-008, P03-T01 | Partial | Reset-to-defaults is in scope, but whether reset is local-only or sends values to connected hardware is unspecified (PC-002). |
| NFR-002, NFR-003, P03-T02 | Covered | Build/lint gates, responsive viewport checks, browser validation, and accessibility checks are assigned. |
| Browser-only/no backend; modular expansion; envelope and future visualizations; D1-D3 | Covered | Scope excludes backend and parsed dumps; registry, patch store, codec, MIDI service, and UI/visualization boundaries are separated. SVG is the initial envelope renderer; denser future views are deferred consistently with research. |

## Verdict

* Verdict: Revise
* Rationale: The plan is well-grounded and preserves the requested browser-only and extensible architecture, but FR-007 does not assign the receive/capture behavior needed to make a fetched raw SysEx dump exportable. Reset behavior also needs a testable contract to avoid editor/device divergence.

## Findings

<!-- rpi:critique id=PC-001 -->
### PC-001 [High]: SysEx fetch has no planned response-capture path

* Related IDs: FR-007, P02-T01, P02-T02, W3, W4
* Evidence: .copilot-tracking/plans/2026-10-06/summit-editor-scaffold-plan.md (P02-T01, P02-T02, FR-007, NFR-001); .copilot-tracking/research/2026-10-06/summit-editor-scaffold-research.md (W3, W4)
* Concern: FR-007 promises requesting the edit buffer and exporting captured raw SysEx, but P02-T01 only assigns input listener lifecycle and P02-T02 only specifies inbound CC reflection, request sending, imported-file validation, and sending. No task defines receipt of SysEx input, retention of the fetched bytes, or export of those captured bytes. The hardware-dependent request may remain experimental, but the browser-side capture/export path can still be implemented and tested with fake MIDI input.
* Impact: The app could send a request and import/send files while still failing the promised fetch-and-save workflow; FR-007 would not be demonstrably implemented.
* Smallest useful change: Extend P02-T02 to define capture of complete inbound SysEx from the selected input, how captured bytes become exportable, and cleanup/invalid-message behavior. Add a fake-input test proving valid response bytes can be captured and exported unchanged, alongside invalid-message rejection. Keep request framing marked experimental pending hardware evidence.
* Action owner: Planning parent (automatic RPI Agent)
* Exact resolving evidence: Updated P02-T02 acceptance criteria plus tests demonstrating a valid fake SysEx response is captured and exported byte-for-byte, malformed input is rejected, and listeners are cleaned up; hardware validation remains explicitly pending.
* Decision route: Direct planner correction

<!-- rpi:critique id=PC-002 -->
### PC-002 [Medium]: Reset-to-defaults has no connected-device contract

* Related IDs: FR-003, FR-008, P02-T02, P03-T01, P03-T02
* Evidence: .copilot-tracking/plans/2026-10-06/summit-editor-scaffold-plan.md (FR-003, FR-008, P03-T01, P03-T02)
* Concern: FR-008 requires resetting visible values, while FR-003 sends registered parameter changes to the selected output. The plan does not say whether reset is local-only or sends the defaults to connected hardware, and the required tests do not cover reset behavior.
* Impact: The UI may show defaults while the Summit retains its prior values, or an implementation may unexpectedly send a bulk set of MIDI messages; neither behavior is currently defined for users or validation.
* Smallest useful change: State the reset contract for connected and offline states and add a fake-port test for the selected behavior, including local state and emitted messages.
* Action owner: Planning parent (automatic RPI Agent)
* Exact resolving evidence: An explicit FR-008/P02-T02 reset contract and a test asserting local state plus fake-port output for connected reset, and local behavior when offline.
* Decision route: Direct planner correction

## Strengths and Residual Risk

* Research and plan consistently separate documented live mappings from alpha SysEx request framing; parsed dump fields remain deferred. The offline browser experience, no-backend constraint, accessibility, and initial SVG envelope are assigned. Real-hardware response behavior remains an explicitly accepted downstream validation risk, not evidence of a defect in this plan.

## Questions or Blocking Evidence Gaps

* None decision-critical for planning. PC-001 and PC-002 can be resolved by making the task contracts and tests explicit without changing the confirmed user direction.

## Limitations

* No source code, hardware, or validation output was supplied or inspected. The assessment cannot establish whether the implementation will satisfy these contracts or whether the experimental request works on Summit hardware.

## Severity Summary and Closeout

* Severity counts: Critical 0; High 1; Medium 1; Low 0.
* Highest-impact finding: PC-001, missing SysEx response capture and export path.
* Action owner: Planning parent (automatic RPI Agent).
* Smallest next action: Add the SysEx capture/export lifecycle and fake-input acceptance test to P02-T02; clarify reset semantics and test them.
* User response required: No. Both items are direct planner corrections within the confirmed scope.

| [.copilot-tracking/plans/2026-10-06/summit-editor-scaffold-plan.md](.copilot-tracking/plans/2026-10-06/summit-editor-scaffold-plan.md) | Plan under critique. |
| [.copilot-tracking/research/2026-10-06/summit-editor-scaffold-research.md](.copilot-tracking/research/2026-10-06/summit-editor-scaffold-research.md) | Supplied architecture and protocol evidence. |
| [.copilot-tracking/state.json](.copilot-tracking/state.json) | Confirms active automatic RPI session and default standard critique. |

## Next Steps

The active automatic RPI parent should revise P02-T02 and clarify FR-008 using the evidence criteria above, then decide whether a follow-up critique is warranted. No user action or response is required.