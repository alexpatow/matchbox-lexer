import result from "../../benchmarks/results/active.json";
export function Measurements() {
  const percent = (value: number) =>
    new Intl.NumberFormat("en", { style: "percent", maximumSignificantDigits: 3 }).format(value);
  return (
    <section className="measurements">
      <h2>Recorded experiment</h2>
      <p>
        {result.experiment} · Matchbox {result.matchbox} · {result.testExamples} test examples
      </p>
      <table>
        <thead>
          <tr>
            <th>Measurement</th>
            <th>Result</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Application agreement</td>
            <td>{percent(result.applicationAgreement)}</td>
            <td>Accepted labels matching the teacher. Abstentions count as failures.</td>
          </tr>
          <tr>
            <td>Abstention</td>
            <td>{percent(result.abstentionRate)}</td>
            <td>Inputs for which the public parser returned no answer.</td>
          </tr>
          <tr>
            <td>Diagnostic agreement</td>
            <td>{percent(result.diagnosticAgreement)}</td>
            <td>Raw labels before acceptance. This is not application accuracy.</td>
          </tr>
          <tr>
            <td>Packaged model</td>
            <td>{result.modelBytes.toLocaleString()} B</td>
            <td>
              {result.parameters.toLocaleString()} parameters. Shared WASM runtime is additional.
            </td>
          </tr>
          <tr>
            <td>Training</td>
            <td>{(result.trainingMs / 1000).toFixed(3)} s</td>
            <td>
              Trainer-reported duration. Data preparation and total CLI time are recorded
              separately.
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
