export type ActionError = { error: string };

export function unauthorized(): ActionError {
  return { error: "UNAUTHORIZED" };
}
