# Headline audit — 29 October 2026

## Scope and evidence

Source: `Auditoria_FN_FP_criterio_titulares_Codex.xlsx`, supplied by the user. The 109 suspicious/priority rows are preserved in `tests/fixtures/headline-audit.json`. The full read-only replay covers 2,012 workbook rows, including historical comparison and rejected candidates; repeated IDs across worksheets are not independent observations or ground-truth labels. No articles were fetched or paywalls bypassed. Human headline review identifies 18 unequivocal false positives, 17 unequivocal valid services, 3 probable false negatives and 71 indeterminate rows. The complete per-ID evidence and local before/after assessment are in [the matrix](headline-editorial-matrix.json).

On the 35 unequivocal headline labels only, local replay precision is 17/26 (65.4%) before and 17/17 (100%) after; recall is 17/17 in both. These are selected controls, not a representative publication sample or a statistical improvement claim. Probable and indeterminate rows are excluded. Persisted production labels are validated separately against the snapshot; a replay difference is never an instruction to rewrite history.

Pipeline: configured feeds → `evaluate_` / `classification_` / `digitalAssessment_` in `src/server/news/Rules.gs` → candidate persistence and classification jobs → persisted `Noticias.clasificacion` → `annotateNews_` / selection → Noticias, Novedades and newsletters. Changing rules does not by itself safely fix existing persisted labels. Candidate rejection, exclusion from a view and physical deletion are different operations.

## Causal fixes

| ID | Evidence | Replay before → after | Editorial decision | Rule / regression |
|---|---|---|---|---|
| 192a4670-6955-4b5b-82b8-aa2f44fa0300 | ALVA lands $20M trade finance facility from Standard Chartered | digital → non-digital | FP confirmed by unequivocal funding headline; high confidence | `fundingFacility`; `headline-editorial.test.mjs` |
| 1a2c9e0c-9770-4220-98d5-3077c7609622 | Shinhan payment for foreign patients | digital → non-digital | FP confirmed by consumer recipient; high confidence | `consumerService`; same test |
| e52fa9c367d1fc2e76d8250183aa18e6 | HSBC launches AI tool for corporate banking clients | non-digital → digital | probable FN; client-facing tool explicit, specific operational channel not established | `clientAi`; same test |
| dc43fe53e30cb7171dac67d579ccc498 | DBS rolls out agentic AI to 350,000 corporate clients | non-digital → digital | probable FN; client-facing rollout explicit | `clientAi`; same test |
| 9879e8401258daead938b6f5835768b8 | Stripe instant B2B transfers; trailing destination truncated | non-digital → digital | probable FN; payment service and B2B are explicit; candidate metadata still needs validation, no automatic restoration | compound instant-B2B transfer evidence; same test |
| ea3d5081ae47024a038e8cb298dc6fc2, 3aa4427abee5efcf45afc0832c4a784d, fcf9a5f231c57fa681f269f4fc46be5f, a44dae984c0bbe311d815f42a4601bee | Maybank ringgit corporate account | unchanged | digital channel undetermined | same test |

Generic outages no longer synthesize an enterprise segment; explicit enterprise outages remain eligible. Consumer evidence does not exclude a mixed business/consumer service. Existing Banco Nación debt and genuine digital-payment controls remain covered. No global thresholds or external calls were introduced. Other workbook cases remain for individual editorial review; a change in replay classification is not permission to mutate historical records.

Noticias now always uses the shared `newsPublisher` renderer, as Novedades does. Its obsolete logo-disable option was removed. Group headings contain country flags only, and logos remain inside each publisher's existing `identity-label`, preserving existing tokens, lazy image loading, dimensions, escaping and unknown-publisher fallback. Initial and appended pages share this rendering path.

## International newsletter regression

`deliverNewsletterBatch_ → newsletterSelectionQuery_ → selectAnnotatedNews_ → newsletterContent_ → newsletterDigest_` already includes international candidates. Production selection code is unchanged. Thirty-two delivery-path fixtures cover Mexico/Spain, fortnightly/quarterly, with/without local evidence and each geographic fallback tier. They assert local priority, own-region/other-own-region/external-same-region/rest hierarchy, persisted accepted delivery and repeat-delivery prevention. The mail transport is mocked; no real email is sent.

## Historical data and publication blocker

Verified production access: Apps Script project `1PVUFcfjfmHoiupAuMW4KIqaE3dk4VaHESkrSXexkD8UmtNqaeaHsIHn9` and Sheet `12ej-8WFP3_E8w12hgO0lZ-WUUV29aKGQqmdYxRezTvg`, corporate account. A read-only pre-change export is saved locally under `output/editorial-audit/production-before.xlsx`; SHA-256: `83895120460f545600c4995b1a202bd6282c8bbb275a99ab17efd925bb51e464`.

The original maintenance flow lacked a safe selective update. The user explicitly authorized extending it with a dry-run, comparison guards and an inverse, and applying only unequivocal reviewed cases. `previewNewsClassificationCorrections` checks up to 20 unique IDs against full-row SHA-256 fingerprints and derives exclusions through the actual classifier. `applyNewsClassificationCorrections` validates the source generation, every old value and row fingerprint before writes, archives and reads back the original rows using the existing verified external archive mechanism, then checks all rows again before writing only the selected classification cells. It reads back the new values and returns a guarded inverse. Partial writes roll back to original values; archive failures write nothing. Admin authorization and the existing foreground lock coordinate workers. IDs, URLs, dates, taxonomy and frozen newsletter contents are preserved; no columns or states are added.

The existing provenance object records the editorial reason and content hash. Maintenance retains these reviewed general-news records, including explicit exclusions, instead of deleting them through its non-digital or duplicate cleanup. No rules-version bump or forced global classification is used. Probable FNs and ambiguous records are not restored or rewritten. Production application and publication remain pending until CI/CodeQL and review pass. No clasp is used. To reverse a successful patch, pass its returned `inverse.plan` and `inverse.rollback` to the same function; changed content or a different generation stops reversal. Revert the Apps Script deployment independently if the release regresses; do not restore an entire live Sheet over subsequent activity.

## Measurements and reproduction

Pre-change production telemetry: dashboard n=216, median 5,747 ms, nearest-rank p95 9,522 ms; classification n=1, 999 ms (insufficient sample); maintenance n=36, median 1,057 ms, p95 9,065 ms. These are mixed historical operations, not isolated measurements of this patch. CPU/RAM and exact Sheet read/write counts are not instrumented here. There is no production after measurement because nothing was published.

`node scripts/audit-headlines.mjs input.json output.json` replays exported workbook evidence before/after `origin/develop` without network, writes, ingestions or email. Its report records every ID/URL, original evidence, prior/new assessment, rule, editorial uncertainty and historical action. Local timings are diagnostic only (one classification per row/version, mixed cold/warm samples); they are not evidence of a production speedup.
