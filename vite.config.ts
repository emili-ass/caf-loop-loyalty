// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { ConfigEnv } from "vite";
import { loadEnv } from "vite";
import { resolveSupabaseConfig } from "./src/integrations/supabase/config";

export default (env: ConfigEnv) => {
  if (env.command === "build") {
    const settings = loadEnv(env.mode, process.cwd(), "VITE_");
    // Fail before bundling so an accidentally supplied administrative key cannot ship.
    resolveSupabaseConfig({
      VITE_SUPABASE_URL: settings["VITE_SUPABASE_URL"],
      VITE_SUPABASE_PUBLISHABLE_KEY: settings["VITE_SUPABASE_PUBLISHABLE_KEY"],
    });
  }
  return defineConfig({
    ...(env.mode === "pages"
      ? { nitro: { preset: "cloudflare-pages", cloudflare: { nodeCompat: true } } }
      : {}),
    tanstackStart: {
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      // nitro/vite builds from this
      server: { entry: "server" },
    },
  })(env);
};
