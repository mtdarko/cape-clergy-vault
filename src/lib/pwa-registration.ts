export function refusesAppWorker({ production, framed, hostname, search }: { production: boolean; framed: boolean; hostname: string; search: string }) {
  return !production || framed || hostname.startsWith("id-preview--") || hostname.startsWith("preview--") ||
    ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`)) || new URLSearchParams(search).get("sw") === "off";
}
export async function registerAppWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (refusesAppWorker({ production: import.meta.env.PROD, framed: window.top !== window.self, hostname: location.hostname, search: location.search })) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter((r) => [r.active, r.waiting, r.installing].some((w) => w && new URL(w.scriptURL).pathname === "/sw.js")).map((r) => r.unregister()));
    return;
  }
  const { registerSW } = await import("virtual:pwa-register");
  registerSW({ immediate: true });
}