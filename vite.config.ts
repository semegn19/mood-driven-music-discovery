import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getMusicCatalog(): Record<string, string[]> {
  const musicDir = path.resolve(__dirname, "public/music");
  const catalog: Record<string, string[]> = {};
  if (fs.existsSync(musicDir)) {
    const moods = fs.readdirSync(musicDir);
    for (const m of moods) {
      const moodPath = path.join(musicDir, m);
      if (fs.statSync(moodPath).isDirectory()) {
        const files = fs.readdirSync(moodPath).filter((f) =>
          /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(f)
        );
        if (files.length > 0) {
          catalog[m] = files.map((f) => `/music/${m}/${encodeURIComponent(f)}`);
        }
      }
    }
  }
  return catalog;
}

function musicCatalogPlugin(): Plugin {
  return {
    name: "music-catalog",
    configureServer(server) {
      server.middlewares.use("/api/music-catalog", (_req, res) => {
        const catalog = getMusicCatalog();
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-cache");
        res.end(JSON.stringify(catalog));
      });
    },
    buildStart() {
      const musicDir = path.resolve(__dirname, "public/music");
      if (fs.existsSync(musicDir)) {
        const catalog = getMusicCatalog();
        fs.writeFileSync(
          path.join(musicDir, "catalog.json"),
          JSON.stringify(catalog, null, 2)
        );
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), musicCatalogPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});

