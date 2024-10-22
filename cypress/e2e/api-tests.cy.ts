/// <reference types="cypress" />

import { createClient } from "@supabase/supabase-js";
import Api from "../../src/index";

// 환경 변수에서 Supabase URL과 anon 키를 가져옴
const SUPABASE_URL = Cypress.env("SUPABASE_URL");
const SUPABASE_ANON_KEY = Cypress.env("SUPABASE_ANON_KEY");

// Supabase 클라이언트 생성
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

describe("hs-fetch API E2E 테스트 (Supabase 사용)", () => {
  // Supabase 로그인 사용자 정보
  const TEST_EMAIL = "test1234@test.com";
  const TEST_PASSWORD = "123456";

  const API_ENDPOINT = Cypress.env("API_ENDPOINT") || "/rest/v1";

  const api = new Api({
    baseUrl: SUPABASE_URL,
    getToken: () => Cypress.env("ACCESS_TOKEN"),
    onRefreshToken: async () => {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: Cypress.env("REFRESH_TOKEN"),
      });

      if (error) {
        throw new Error("Token refresh failed: " + error.message);
      }

      if (data?.session?.access_token) {
        Cypress.env("ACCESS_TOKEN", data.session.access_token);
        Cypress.env("REFRESH_TOKEN", data.session.refresh_token);

        // 갱신된 토큰을 콘솔에 기록
        cy.log("New ACCESS_TOKEN:", data.session.access_token);
        cy.log("New REFRESH_TOKEN:", data.session.refresh_token);
      } else {
        throw new Error("Failed to get a new access token");
      }
    },
  });

  before(() => {
    // 테스트 시작 전에 사용자 로그인
    cy.login(TEST_EMAIL, TEST_PASSWORD);
  });

  beforeEach(() => {
    // 모든 요청에 apikey를 포함하도록 설정
    Cypress.on("request", (options) => {
      options.headers = {
        ...options.headers,
        apikey: SUPABASE_ANON_KEY,
      };
    });
  });

  it("GET 요청 테스트 (Supabase 데이터 조회)", () => {
    api.get({
      url: `${API_ENDPOINT}/test`,
      query: { select: "*" },
      beforeRequest: (url, options) => {
        // 요청 전에 토큰이 제대로 적용되었는지 확인
        options.headers = {
          ...options.headers,
          apikey: SUPABASE_ANON_KEY,
        };
        cy.log("Using ACCESS_TOKEN:", Cypress.env("ACCESS_TOKEN"));
      },
      onSuccess: (data) => {
        expect(data).to.be.an("array");
      },
      onError: (error) => {
        throw new Error("GET 요청 실패: " + error.message);
      },
    });
  });

  it("POST 요청 테스트 (Supabase 데이터 추가)", () => {
    api.post({
      url: `${API_ENDPOINT}/test`,
      body: { key: "value" },
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      beforeRequest: (url, options) => {
        // 요청 전에 토큰이 제대로 적용되었는지 확인
        options.headers = {
          ...options.headers,
          apikey: SUPABASE_ANON_KEY,
        };
        cy.log("Using ACCESS_TOKEN:", Cypress.env("ACCESS_TOKEN"));
      },
      onSuccess: (data) => {
        expect(data).to.have.length.greaterThan(0);
      },
      onError: (error) => {
        throw new Error("POST 요청 실패: " + error.message);
      },
    });
  });

  it("토큰 만료 시 재발급 테스트 (Supabase)", () => {
    // 만료된 토큰 설정
    Cypress.env("ACCESS_TOKEN", "expired_token");

    // 이후 요청 전 갱신된 토큰을 Cypress 환경 변수에서 가져오는 부분에서 확인
    cy.log("Using ACCESS_TOKEN before refresh:", Cypress.env("ACCESS_TOKEN"));

    api.get({
      url: `${API_ENDPOINT}/test`,
      query: { select: "*" },
      beforeRequest: (url, options) => {
        // 갱신된 토큰을 사용하기 위한 설정
        options.headers = {
          ...options.headers,
          apikey: SUPABASE_ANON_KEY,
        };
        cy.log("Using ACCESS_TOKEN:", Cypress.env("ACCESS_TOKEN"));
      },
      onSuccess: (data) => {
        expect(data).to.be.an("array");
      },
      onError: (error) => {
        throw new Error("토큰 재발급 실패: " + error.message);
      },
    });
  });

  it("전처리 후처리 훅 테스트 (Supabase)", () => {
    api.get({
      url: `${API_ENDPOINT}/test`,
      beforeRequest: (url, options) => {
        expect(url).to.contain("/test");
        options.headers = {
          ...options.headers,
          "X-Custom-Header": "customValue",
          apikey: SUPABASE_ANON_KEY,
        };
        cy.log("Using ACCESS_TOKEN:", Cypress.env("ACCESS_TOKEN"));
      },
      afterResponse: (response) => {
        expect(response.status).to.equal(200);
      },
      onSuccess: (data) => {
        expect(data).to.be.an("array");
      },
    });
  });
});
