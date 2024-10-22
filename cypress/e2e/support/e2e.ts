import "./command";

// ***********************************************************
// 이 파일은 모든 E2E 테스트에서 자동으로 로드됩니다.
// 이곳에 커스텀 명령어, 전역적인 설정 등을 추가할 수 있습니다.
// ***********************************************************

// 예: Cypress 커스텀 명령어 정의
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("SUPABASE_URL")}/auth/v1/token?grant_type=password`,
    body: {
      email,
      password,
    },
    headers: {
      apikey: Cypress.env("SUPABASE_ANON_KEY"),
      "Content-Type": "application/json",
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    Cypress.env("ACCESS_TOKEN", response.body.access_token);
    Cypress.env("REFRESH_TOKEN", response.body.refresh_token);
  });
});

// 전역적으로 테스트 실행 전에 해야 할 설정
before(() => {
  // 예시로 테스트 유저 로그인 또는 기타 초기 설정
  cy.login("test1234@test.com", "123456");
});

// 예: 에러 발생 시 Cypress가 실패하지 않도록 전역 에러 핸들링
Cypress.on("uncaught:exception", (err, runnable) => {
  // 에러를 무시하고 테스트를 계속 진행합니다.
  return false;
});
