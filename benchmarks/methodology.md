# Evaluation contract

Experiment 00 is a wiring pilot. It is not comparable to the full-corpus series.

The original full series uses the unchanged gpu-lexer corpus builder at commit `1e514fd681e31d6b19296f985fb01d8fdc0ae74f`. All prepared training records are used. The upstream mining split serves as validation, and the entire verification split serves as test. Language is teacher metadata only. It is never an input feature. Full upstream training means the prepared training shard, not the promoted model's accumulated warm-start and replay history.

Preparation streams archives, retaining all recognized-language files eligible for upstream's 65,536-byte source limit and license notices. It omits unrelated assets and archives to reduce disk usage. Selection, quotas, minification, Shiki labeling and deduplication remain upstream code. Source provenance, package versions and dataset hashes identify each run. Full records retain their complete prepared source; the pilot's mid-file slices could lack opening lexical context and are explicitly excluded from the evolution comparison.

Shiki labels are mapped through upstream's nine-class taxonomy. Uncovered line separators receive plain labels. Malformed or missing labels fail preparation. The decoder only merges adjacent equal predicted labels and checks complete UTF-16 coverage. It contains no syntax rules. No test examples, teacher labels or language IDs participate in inference.

The `full-snippets-v1` series adds independently labeled line windows and Markdown fences from the original training and validation splits. It preserves the entire test split byte-for-byte and excludes website evaluation samples from added training data. Its selection policy and frozen hashes are documented in [snippet training](../docs/snippet-training.md). Comparisons with the original model use the same test inputs and scorer; training and validation hashes intentionally differ.

## Quality

Count Unicode code points excluding whitespace. Report overall label agreement, class precision/recall/F1, styled macro F1 over non-plain classes with test support, and language slices. The nine-class confusion matrix includes an extra abstention column. Abstentions count as errors in overall agreement. Accepted-only accuracy is null when there are no accepted characters. Exact match compares canonical complete span arrays.

Application results come from `parser.parse`. Diagnostic results come from the documented `loadArtifact().inspect` API, bypassing acceptance for measurement only. Diagnostic results are never shown as accepted application output. Partial results come from `parse(input, { allowPartial: true })`. Their scores include every returned candidate label, including uncertain ranges, and must not be described as confident coverage. In the shared report format, `accepted` counts non-null outputs, including partial candidates. Character coverage measures non-whitespace code points with returned labels. Recognition scores are uncalibrated.

The original 0.4.0 pipeline uses the published recurrent classifier with explicit text-part encoding, text features and span supervision. It uses the released defaults without test-set tuning. The snippet-trained pipeline uses the same primitives and a learning rate of 0.0015; validation selects the exported epoch. The 0.3.0 pipeline used lowercase character keys and `contextRadius: 4`, a nine-character window. The 0.2.2 reference used a three-character window. For the original full-corpus comparisons, corpus selection, supervision, decoding, scoring, and acceptance thresholds are unchanged. The wider configuration was chosen using framework validation measurements before this published-package reproduction.

The research export gate permits zero exact accuracy and a 2 MB artifact. This allows measuring failed models and is not a production acceptance policy. The published inference threshold is unchanged. Test data is used only for final reporting, not tuning.

## Runtime

Use a production Vite build. Each engine runs in a fresh Playwright browser context. Record browser version, OS and architecture. Cold initialization includes dynamic import, loading and the same initial source probe for every engine. It is a single observation, not a cold-start percentile. These cold paths are not perfectly identical and should not be presented as architectural proof.

The 0.4.0 benchmark warms each engine on the first 20 test documents, then times one sequential pass over all 1,915 complete test documents. Strict CPU, partial CPU and partial WebGPU calls are measured separately, with their output statuses and quality recorded. Fetched JavaScript and WASM bodies are hashed and gzip-compressed locally; these are reproducible payload sizes, not network timings. Common benchmark-page assets are included in each fetched total.

For the separate historical short-prefix timing, use the same first test input sliced to 128, 512 and 1,024 UTF-16 units. Run five warm-ups and 30 sequential measured calls, awaiting completion. Report nearest-rank p50/p95 and statuses. A fast abstention is not successful highlighting. Input-length timing samples are not independent accuracy examples. Resource entries show actual localhost response body sizes; asset manifests separately include raw, gzip and Brotli byte counts. Reference dependencies load only when requested. The full build contains teacher grammars, so total dist size is not Matchbox's runtime footprint.

The gpu-lexer npm comparator is pinned to 0.0.2. It is not assumed identical to upstream's latest promoted checkpoint. A missing WebGPU adapter is recorded as unavailable, never replaced by an invented timing. The browser's Shiki reference needs a language hint, unlike either learned model. Upstream verification may have influenced gpu-lexer's checkpoint selection; this is a consumer comparison, not a claim of equally untouched training histories.

## Training time

Keep the trainer-reported `trainingMs`, external CLI wall time, peak resident memory, package versions, hardware, and heap limit. Wall time includes process startup, validation, training, evaluation and packaging. Data fetching and teacher labeling are a separate preparation phase. Failed runs retain their elapsed time and failure reason. Do not compare a failed or limited run with a successful full run as if they did equivalent work.

Keep each experiment's reports. Before comparing runs, verify identical data hashes and scoring code. A changed corpus starts a new series rather than silently replacing an earlier result.
