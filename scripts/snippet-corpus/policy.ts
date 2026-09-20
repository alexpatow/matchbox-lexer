export const normalize = (input: string) => input.replace(/\s+/gu, " ").trim().toLowerCase();

export function overlapsHeldOut(
  input: string,
  heldOut: readonly string[],
  website: readonly string[],
) {
  return (
    heldOut.some((text) => text.includes(input)) ||
    website.some((text) => text.includes(input) || input.includes(text))
  );
}
