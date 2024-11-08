declare namespace Cypress {
  interface Chainable<Subject = any> {
    /**
     * Custom command to login to Supabase
     * @example cy.login('email', 'password')
     */
    login(email: string, password: string): Chainable<void>;
  }
}
