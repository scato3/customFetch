// 환경 변수에서 Supabase URL과 anon 키를 가져옴
const SUPABASE_URL = Cypress.env("SUPABASE_URL");
const SUPABASE_ANON_KEY = Cypress.env("SUPABASE_ANON_KEY");

// 로그인 커맨드 추가
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.request({
    method: "POST",
    url: `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    body: {
      email,
      password,
    },
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    failOnStatusCode: false,
  }).then((response) => {
    // 응답 상태가 200인지 확인
    if (response.status === 200) {
      Cypress.env("ACCESS_TOKEN", response.body.access_token);
      Cypress.env("REFRESH_TOKEN", response.body.refresh_token);
    } else {
      throw new Error("로그인 실패: " + response.body.message);
    }
  });
});
