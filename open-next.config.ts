import { defineCloudflareConfig } from "@opennextjs/cloudflare"

// Every route in this app is prerendered at build time (no ISR, no route
// handlers, no server actions), so no incremental cache backend is needed.
// If on-demand revalidation is ever added, wire up an incremental cache here:
// https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig()
