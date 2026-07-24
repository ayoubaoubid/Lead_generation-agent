import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_lrpnrgcyxseuxwibdunw",
  dirs: ["./trigger"],
  maxDuration: 300,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 1,
    },
  },
});
