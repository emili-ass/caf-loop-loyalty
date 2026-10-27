// Lovable supplies TanStack Start and the Nitro plugin.
// Select the Node server output for Render; do not register duplicate plugins.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: { preset: "node-server" },
});
