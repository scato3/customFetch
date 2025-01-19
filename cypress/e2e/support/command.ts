/// <reference types="cypress" />
const SUPABASE_URL = Cypress.env("SUPABASE_URL");
const SUPABASE_ANON_KEY = Cypress.env("SUPABASE_ANON_KEY");

// Add login command
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.request({
    method: "POST",
    url: `${SUPABASE_URL.replace('http://', 'https://')}/auth/v1/token?grant_type=password`,
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
    // Check if the response status is 200
    if (response.status === 200) {
      Cypress.env("ACCESS_TOKEN", response.body.access_token);
      Cypress.env("REFRESH_TOKEN", response.body.refresh_token);
    } else {
      throw new Error("Login failed: " + response.body.message);
    }
  });
});