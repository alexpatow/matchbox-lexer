import { createReadStream } from "node:fs";
import { createGunzip } from "node:zlib";
import { StringDecoder } from "node:string_decoder";

export async function* readShard(path: string) {
  const decoder = new StringDecoder("utf8");
  let pending = "";
  for await (const chunk of createReadStream(path).pipe(createGunzip())) {
    pending += decoder.write(chunk);
    let newline = pending.indexOf("\n");
    while (newline >= 0) {
      const line = pending.slice(0, newline);
      pending = pending.slice(newline + 1);
      if (line) {
        yield JSON.parse(line);
      }
      newline = pending.indexOf("\n");
    }
  }
  pending += decoder.end();
  if (pending.trim()) {
    yield JSON.parse(pending);
  }
}
