import React from "react";
import { createMemoryHistory } from "history";
import { Login } from "../index";
import { Router, Route } from "react-router-dom";
import { MockedProvider } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import { render, fireEvent, waitFor } from "@testing-library/react";

import { AUTH_URL } from "../../../lib/graphql/queries";
import { LOG_IN } from "../../../lib/graphql/mutations";

global.matchMedia =
  global.matchMedia ||
  function () {
    return {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };
  };

Object.defineProperty(window, "location", {
  writable: true,
  value: { assign: jest.fn() },
});

const defaultProps = {
  setViewer: () => {},
};

describe("Login", () => {
  // remove console error with window.scrollTo
  window.scrollTo = () => {};

  describe("AUTH_URL Query", () => {
    it("redirects the user when query is successful", async () => {
      window.location.assign = jest.fn();

      const authUrlMock = {
        request: {
          query: AUTH_URL,
        },
        result: {
          data: {
            authUrl: "https://google.com/signin",
          },
        },
      };

      const history = createMemoryHistory({
        initialEntries: ["/login"],
      });

      const { getByRole, queryByText } = render(
        <MockedProvider mocks={[authUrlMock]} addTypename={false}>
          <Router history={history}>
            <Route path="/login">
              <Login {...defaultProps} />
            </Route>
          </Router>
        </MockedProvider>
      );

      const authUrlButton = getByRole("button");
      fireEvent.click(authUrlButton);

      await waitFor(() => {
        expect(window.location.assign).toHaveBeenCalledWith(
          "https://google.com/signin"
        );
        expect(
          queryByText(
            "Sorry we weren't able to log you in. Please try again later!"
          )
        ).toBeNull();
      });
    });

    it("does not redirect the user when query is unsuccessful", async () => {
      window.location.assign = jest.fn();

      const authUrlMock = {
        request: {
          query: AUTH_URL,
        },
        errors: [new GraphQLError("Something went wrong!")],
      };

      const history = createMemoryHistory({
        initialEntries: ["/login"],
      });

      const { getByRole, queryByText } = render(
        <MockedProvider mocks={[authUrlMock]} addTypename={false}>
          <Router history={history}>
            <Route path="/login">
              <Login {...defaultProps} />
            </Route>
          </Router>
        </MockedProvider>
      );

      const authUrlButton = getByRole("button");
      fireEvent.click(authUrlButton);

      await waitFor(() => {
        expect(window.location.assign).not.toHaveBeenCalledWith(
          "https://google.com/signin"
        );
        expect(
          queryByText(
            "Sorry we weren't able to log you in. Please try again later!"
          )
        ).not.toBeNull();
      });
    });
  });

  describe("LOGIN Mutation", () => {
    it("when no code exists in the /login route, the mutation is not fired", async () => {
      window.location.assign = jest.fn();

      const logInMock = {
        request: {
          query: LOG_IN,
          variables: {
            input: {
              code: "1234",
            },
          },
        },
        result: {
          data: {
            logIn: {
              id: "324",
              token: "3242",
              avatar: "image.png",
              hasWallet: false,
              didRequest: true,
            },
          },
        },
      };

      const history = createMemoryHistory({
        initialEntries: ["/login"],
      });

      render(
        <MockedProvider mocks={[logInMock]} addTypename={false}>
          <Router history={history}>
            <Route path="/login">
              <Login {...defaultProps} />
            </Route>
          </Router>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(history.location.pathname).not.toBe("/user/324");
      });
    });

    describe("when code exists in teh /login route as a query parameter", () => {
      it("displays a loading indicator when the mutation is in progress", async () => {
        const history = createMemoryHistory({
          initialEntries: ["/login?code=1234"],
        });

        const { queryByText } = render(
          <MockedProvider mocks={[]}>
            <Router history={history}>
              <Route path="/login">
                <Login {...defaultProps} />
              </Route>
            </Router>
          </MockedProvider>
        );

        await waitFor(() => {
          expect(queryByText("Logging you in...")).not.toBeNull();
        });
      });
      it("redirects the user to their user page when mutation is successful", async () => {
        window.location.assign = jest.fn();

        const logInMock = {
          request: {
            query: LOG_IN,
            variables: {
              input: {
                code: "1234",
              },
            },
          },
          result: {
            data: {
              logIn: {
                id: "324",
                token: "3242",
                avatar: "image.png",
                hasWallet: false,
                didRequest: true,
              },
            },
          },
        };

        const history = createMemoryHistory({
          initialEntries: ["/login?code=1234"],
        });

        render(
          <MockedProvider mocks={[logInMock]} addTypename={false}>
            <Router history={history}>
              <Route path="/login">
                <Login {...defaultProps} />
              </Route>
            </Router>
          </MockedProvider>
        );

        await waitFor(() => {
          expect(history.location.pathname).toBe("/user/324");
        });
      });
      it("does not redirect the user to their user page and displays an error message when the mutation is unsuccesful", async () => {
        window.location.assign = jest.fn();

        const logInMock = {
          request: {
            query: LOG_IN,
            variables: {
              input: {
                code: "1234",
              },
            },
          },
          errors: [new GraphQLError("Something went wrong!")],
        };

        const history = createMemoryHistory({
          initialEntries: ["/login?code=1234"],
        });

        const { queryByText } = render(
          <MockedProvider mocks={[logInMock]} addTypename={false}>
            <Router history={history}>
              <Route path="/login">
                <Login {...defaultProps} />
              </Route>
            </Router>
          </MockedProvider>
        );

        await waitFor(() => {
          expect(history.location.pathname).not.toBe("/user/324");
          expect(
            queryByText(
              "Sorry! We weren't able to log you in. Please try again later!"
            )
          ).not.toBeNull();
        });
      });
    });
  });
});
