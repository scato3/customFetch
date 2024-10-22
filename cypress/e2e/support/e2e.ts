import "./command";

// ***********************************************************
// This file is automatically loaded before every E2E test.
// You can add custom commands, global configurations, and more here.
// ***********************************************************

// Example: Define a custom Cypress command
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

// Global settings to run before all tests
before(() => {
  // Example: Log in test user or perform other initial setup
  cy.login("test1234@test.com", "123456");
});

// Example: Globally handle errors to prevent Cypress from failing the test
Cypress.on("uncaught:exception", (err, runnable) => {
  // Ignore the error and continue the tests
  return false;
});
