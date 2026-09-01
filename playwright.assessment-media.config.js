import baseConfig from "./playwright.config.js";

const baseURL = "http://127.0.0.1:4185";

export default {
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL,
  },
  webServer: {
    ...baseConfig.webServer,
    command: "npm run dev -- --host 127.0.0.1 --port 4185 --strictPort",
    url: baseURL,
    reuseExistingServer: false,
  },
};
