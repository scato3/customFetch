/// <reference types="cypress" />

import { createClient } from "@supabase/supabase-js";
import Api from "../../src/index";

// Fetch Supabase URL and anon key from environment variables
const SUPABASE_URL = Cypress.env("SUPABASE_URL");
const SUPABASE_ANON_KEY = Cypress.env("SUPABASE_ANON_KEY");

// Create a Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

describe("hs-fetch API E2E Test (Using Supabase)", () => {
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
        cy.log("New ACCESS_TOKEN:", data.session.access_token);
        cy.log("New REFRESH_TOKEN:", data.session.refresh_token);
      } else {
        throw new Error("Failed to get a new access token");
      }
    },
  });

  it("GET Request Test (Retrieve Data from Supabase)", () => {
    api.get({
      url: `${API_ENDPOINT}/test`,
      query: { select: "*" },
      beforeRequest: (url, options) => {
        options.headers = {
          ...options.headers,
          apikey: SUPABASE_ANON_KEY,
        };
        cy.log("Using ACCESS_TOKEN:", Cypress.env("ACCESS_TOKEN"));
      },
      onSuccess: (data) => {
        const responseData = data as any[];
        expect(responseData).to.be.an("array");
        if (responseData.length > 0) {
          expect(responseData[0]).to.have.property("key");
        }
      },
      onError: (error) => {
        throw new Error("GET request failed: " + error.message);
      },
    });
  });

  it("POST Request Test (Add Data to Supabase)", () => {
    api.post({
      url: `${API_ENDPOINT}/test`,
      body: { key: "value" },
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      beforeRequest: (url, options) => {
        options.headers = {
          ...options.headers,
          apikey: SUPABASE_ANON_KEY,
        };
        cy.log("Using ACCESS_TOKEN:", Cypress.env("ACCESS_TOKEN"));
      },
      onSuccess: (data) => {
        // Check if the POST response contains the expected property
        expect(data).to.have.property("key", "value");
        cy.log("Posted data:", JSON.stringify(data));
      },
      onError: (error) => {
        throw new Error("POST request failed: " + error.message);
      },
    });
  });

  it("PUT Request Test (Update Data in Supabase)", () => {
    api.put({
      url: `${API_ENDPOINT}/test?id=eq.21`,
      body: { id: 21, key: "put" },
      headers: {
        "Content-Type": "application/json",
      },
      beforeRequest: (url, options) => {
        options.headers = {
          ...options.headers,
          apikey: SUPABASE_ANON_KEY,
        };
        cy.log("Using ACCESS_TOKEN:", Cypress.env("ACCESS_TOKEN"));
      },
      onSuccess: (data) => {
        // Handle different response structures for PUT requests
        if (Array.isArray(data)) {
          // If the response is an array
          expect(data).to.be.an("array").that.is.not.empty;
          expect(data[0]).to.have.property("key", "put");
        } else {
          // If the response is an object
          expect(data).to.be.an("object").that.has.property("key", "put");
        }
        cy.log("Updated data:", JSON.stringify(data));
      },
      onError: (error) => {
        throw new Error("PUT request failed: " + error.message);
      },
    });
  });

  it("PATCH Request Test (Partially Update Data in Supabase)", () => {
    api.patch({
      url: `${API_ENDPOINT}/test?id=eq.23`,
      body: { id: 23, key: "patch" },
      headers: {
        "Content-Type": "application/json",
      },
      beforeRequest: (url, options) => {
        options.headers = {
          ...options.headers,
          apikey: SUPABASE_ANON_KEY,
        };
        cy.log("Using ACCESS_TOKEN:", Cypress.env("ACCESS_TOKEN"));
      },
      onSuccess: (data) => {
        // Handle different response structures for PATCH requests
        if (Array.isArray(data)) {
          expect(data).to.be.an("array").that.is.not.empty;
          expect(data[0]).to.have.property("key", "patch");
        } else {
          expect(data).to.be.an("object").that.has.property("key", "patch");
        }
        cy.log("Partially updated data:", JSON.stringify(data));
      },
      onError: (error) => {
        throw new Error("PATCH request failed: " + error.message);
      },
    });
  });

  it("DELETE Request Test (Delete Data in Supabase)", () => {
    api.delete({
      url: `${API_ENDPOINT}/test?id=eq.25`,
      headers: {
        "Content-Type": "application/json",
      },
      beforeRequest: (url, options) => {
        options.headers = {
          ...options.headers,
          apikey: SUPABASE_ANON_KEY,
        };
        cy.log("Using ACCESS_TOKEN:", Cypress.env("ACCESS_TOKEN"));
      },
      onSuccess: () => {
        // Confirm that the data with the deleted id no longer exists
        api.get({
          url: `${API_ENDPOINT}/test?id=eq.25`,
          onSuccess: (data) => {
            expect(data).to.be.an("array").that.is.empty;
            cy.log("Data with ID 25 deleted:", JSON.stringify(data));
          },
          onError: (error) => {
            throw new Error(
              "Failed to confirm data deletion: " + error.message
            );
          },
        });
      },
      onError: (error) => {
        throw new Error("DELETE request failed: " + error.message);
      },
    });
  });

  it("Token Expiry and Refresh Test (Supabase)", () => {
    // Set an expired token
    Cypress.env("ACCESS_TOKEN", "expired_token");

    cy.log("Using ACCESS_TOKEN before refresh:", Cypress.env("ACCESS_TOKEN"));

    api.get({
      url: `${API_ENDPOINT}/test`,
      query: { select: "*" },
      beforeRequest: (url, options) => {
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
        throw new Error("Token refresh failed: " + error.message);
      },
    });
  });

  it("Pre-Request and Post-Response Hook Test (Supabase)", () => {
    api.get({
      url: `${API_ENDPOINT}/test`,
      beforeRequest: (url, options) => {
        expect(url).to.contain("/test");
        options.headers = {
          ...options.headers,
          apikey: SUPABASE_ANON_KEY,
          "X-Custom-Header": "customValue",
        };
        cy.log("Request headers:", JSON.stringify(options.headers));
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