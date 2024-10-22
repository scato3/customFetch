import { defineConfig } from "cypress";
import * as dotenv from "dotenv";

// .env 파일에서 환경 변수 로드
dotenv.config();

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Node 이벤트 추가 가능
    },
    supportFile: "cypress/e2e/support/e2e.ts",
    watchForFileChanges: true,
  },
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    ACCESS_TOKEN: "",
    REFRESH_TOKEN: "",
  },
});
