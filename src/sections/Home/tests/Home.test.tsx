import React from "react";
import { createMemoryHistory } from "history";
import { Home } from "../index";
import { Router } from "react-router-dom";
import { MockedProvider } from "@apollo/client/testing";
import { render, fireEvent, waitFor } from "@testing-library/react";

import { LISTINGS } from "../../../lib/graphql/queries";
import { ListingsFilter } from "../../../lib/graphql/globalTypes";

global.matchMedia =
  global.matchMedia ||
  function () {
    return {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };
  };

describe("Home", () => {
  // remove console error with window.scrollTo
  window.scrollTo = () => {};

  describe("search input", () => {
    it("renders an empty search input on initial render", async () => {
      const history = createMemoryHistory();

      const { getByPlaceholderText } = render(
        <MockedProvider mocks={[]}>
          <Router history={history}>
            <Home />
          </Router>
        </MockedProvider>
      );

      await waitFor(() => {
        const searchInput = getByPlaceholderText(
          "Search 'San Fransisco'"
        ) as HTMLInputElement;

        expect(searchInput.value).toEqual("");
      });
    });

    it("redirects the user to the /listings page when a valid search is provided", async () => {
      const history = createMemoryHistory();

      const { getByPlaceholderText } = render(
        <MockedProvider mocks={[]}>
          <Router history={history}>
            <Home />
          </Router>
        </MockedProvider>
      );

      await waitFor(() => {
        const searchInput = getByPlaceholderText(
          "Search 'San Fransisco'"
        ) as HTMLInputElement;

        fireEvent.change(searchInput, { target: { value: "Toronto" } });
        fireEvent.keyDown(searchInput, { key: "Enter", keyCode: 13 });

        expect(history.location.pathname).toBe("/listings/Toronto");
      });
    });

    it("does not redirect the user to the /listings page when a invalid search is provided", async () => {
      const history = createMemoryHistory();

      const { getByPlaceholderText } = render(
        <MockedProvider mocks={[]}>
          <Router history={history}>
            <Home />
          </Router>
        </MockedProvider>
      );

      await waitFor(() => {
        const searchInput = getByPlaceholderText(
          "Search 'San Fransisco'"
        ) as HTMLInputElement;

        fireEvent.change(searchInput, { target: { value: "" } });
        fireEvent.keyDown(searchInput, { key: "Enter", keyCode: 13 });

        expect(history.location.pathname).toBe("/");
      });
    });
  });

  describe("premium listings", () => {
    it("renders the loading state when the query is loading", async () => {
      const history = createMemoryHistory();

      const { queryByText } = render(
        <MockedProvider mocks={[]}>
          <Router history={history}>
            <Home />
          </Router>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(queryByText("Premium Listings - Loading")).not.toBeNull();
        expect(queryByText("Premium Listings")).toBeNull();
      });
    });

    it("renders the intended UI when query is successful", async () => {
      const listingsMock = {
        request: {
          query: LISTINGS,
          variables: {
            filter: ListingsFilter.PRICE_HIGH_TO_LOW,
            limit: 4,
            page: 1,
          },
        },
        result: {
          data: {
            listings: {
              region: null,
              total: 10,
              result: [
                {
                  id: "1234",
                  title: "2234",
                  image: "image.png",
                  address: "dsafk",
                  price: 324,
                  numOfGuests: 2,
                },
              ],
            },
          },
        },
      };

      const history = createMemoryHistory();

      const { queryByText } = render(
        <MockedProvider mocks={[listingsMock]} addTypename={false}>
          <Router history={history}>
            <Home />
          </Router>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(queryByText("Premium Listings - Loading")).toBeNull();
        expect(queryByText("Premium Listings")).not.toBeNull();
      });
    });

    it("does not render the loading section or the listing section when query has an error", async () => {
      const listingsMock = {
        request: {
          query: LISTINGS,
          variables: {
            filter: ListingsFilter.PRICE_HIGH_TO_LOW,
            limit: 4,
            page: 1,
          },
        },

        error: new Error("Network Error!"),
      };

      const history = createMemoryHistory();

      const { queryByText } = render(
        <MockedProvider mocks={[listingsMock]} addTypename={false}>
          <Router history={history}>
            <Home />
          </Router>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(queryByText("Premium Listings - Loading")).toBeNull();
        expect(queryByText("Premium Listings")).toBeNull();
      });
    });
  });
});
