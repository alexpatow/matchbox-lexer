import { labels, type Span } from "../matchbox/lexer/labels";
export function createMetrics() {
  const confusion = labels.map(() => Array<number>(labels.length + 1).fill(0));
  let snippets = 0;
  let accepted = 0;
  let exact = 0;
  return {
    add(input: string, expected: Span[], actual: Span[] | null) {
      snippets++;
      if (actual !== null) {
        accepted++;
      }
      if (JSON.stringify(actual) === JSON.stringify(expected)) {
        exact++;
      }
      let truthIndex = 0;
      let predictionIndex = 0;
      let offset = 0;
      for (const character of input) {
        while (expected[truthIndex]?.end <= offset) {
          truthIndex++;
        }
        while (actual && predictionIndex < actual.length && actual[predictionIndex].end <= offset) {
          predictionIndex++;
        }
        if (!/\s/u.test(character)) {
          const truth = expected[truthIndex];
          if (!truth || truth.start > offset) {
            throw new Error("Incomplete ground truth");
          }
          const prediction = actual?.[predictionIndex];
          const predictedId =
            prediction && prediction.start <= offset ? labels.indexOf(prediction.type) : -1;
          confusion[labels.indexOf(truth.type)][predictedId < 0 ? labels.length : predictedId]++;
        }
        offset += character.length;
      }
    },
    report() {
      const count = confusion.flat().reduce((a, b) => a + b, 0);
      const correct = labels.reduce((sum, _, i) => sum + confusion[i][i], 0);
      const abstained = confusion.reduce((sum, row) => sum + row[labels.length], 0);
      const classes = labels.map((label, i) => {
        const support = confusion[i].reduce((a, b) => a + b, 0);
        const predicted = confusion.reduce((sum, row) => sum + row[i], 0);
        const tp = confusion[i][i];
        return {
          label,
          support,
          precision: predicted ? tp / predicted : null,
          recall: support ? tp / support : null,
          f1: support + predicted ? (2 * tp) / (support + predicted) : null,
        };
      });
      const styled = classes.filter((row) => row.label !== "plain" && row.support > 0);
      return {
        snippets,
        accepted,
        abstentionRate: snippets ? 1 - accepted / snippets : null,
        exactAccuracy: snippets ? exact / snippets : null,
        characters: count,
        agreement: count ? correct / count : null,
        acceptedCharacterAgreement: count > abstained ? correct / (count - abstained) : null,
        styledMacroF1: styled.length
          ? styled.reduce((sum, row) => sum + (row.f1 ?? 0), 0) / styled.length
          : null,
        classes,
        confusion,
        confusionColumns: [...labels, "abstain"],
      };
    },
  };
}
