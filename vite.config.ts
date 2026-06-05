import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the production build can be opened from any path,
// including directly from the filesystem after `npm run build`.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 5180,
    open: true,
  },
});
