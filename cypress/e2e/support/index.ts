declare namespace Cypress {
  interface Chainable<Subject = any> {
    /**
     * Custom command to log in to the application
     * @example cy.login('email', 'password')
     */
    login(email: string, password: string): Chainable<void>;
  }
}
