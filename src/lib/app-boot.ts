/**
 * Has the client app finished its first hydration? Set by <BootMarker /> in
 * the root layout. Lets page-level client components tell a full page load
 * (still hydrating: false) from a client-side navigation (true) — the home
 * page's loader plays only on the former.
 */
let booted = false;

export function markBooted(): void {
  booted = true;
}

export function hasBooted(): boolean {
  return booted;
}
