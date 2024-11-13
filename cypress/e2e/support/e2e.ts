import "./command";

// ***********************************************************
// This file is automatically loaded before every E2E test.
// You can add custom commands, global configurations, and more here.
// ***********************************************************

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
