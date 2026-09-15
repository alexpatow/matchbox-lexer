import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";
import { labels } from "./labels.ts";
export default defineParser({
  input: z.string(),
  output: z.array(
    z.strictObject({
      type: z.enum(labels),
      start: z.number().int().nonnegative(),
      end: z.number().int().positive(),
    }),
  ),
});
