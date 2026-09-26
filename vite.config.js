import { defineConfig } from "vite";

export default defineConfig({
  base: "/FaroesteSuvivors/",
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "three-vendor",
              test: /node_modules[\\/]three[\\/]/,
              maxSize: 450_000,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
