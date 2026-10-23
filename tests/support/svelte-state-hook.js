// Lets Node import the src/lib/*.svelte.js modules without the Svelte compiler.
// `$state(value)` only makes `value` reactive for the UI. Tests don't need reactivity,
// so here it becomes plain `(value)`.
export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (!new URL(url).pathname.endsWith('.svelte.js')) return result;
  return { ...result, source: String(result.source).replaceAll('$state(', '(') };
}
