import React, { useState, useEffect, useRef } from "react";
import { render } from "react-dom";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import reportWebVitals from "./reportWebVitals";
import { Affix, Spin, Layout } from "antd";
import {
  AppHeader,
  Home,
  Host,
  Listing,
  Listings,
  Login,
  NotFound,
  User,
  Stripe,
} from "./sections";
import { AppHeaderSkeleton, ErrorBanner } from "./lib/components";
import { LOG_IN } from "./lib/graphql/mutations";
import {
  LogIn as LogInData,
  LogInVariables,
} from "./lib/graphql/mutations/LogIn/__generated__/LogIn";
import { Viewer } from "./lib/types";
import "./styles/index.css";

import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  ApolloProvider,
  useMutation,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(`${process.env.REACT_APP_S_PUBLISHABLE_KEY}`);

const httpLink = createHttpLink({
  uri: "/api",
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      "X-CSRF-TOKEN": sessionStorage.getItem("token") || "",
    },
  };
});

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: authLink.concat(httpLink),
});

const initialViewer: Viewer = {
  id: null,
  token: null,
  avatar: null,
  hasWallet: null,
  didRequest: false,
};

const App = () => {
  const [viewer, setViewer] = useState<Viewer>(initialViewer);
  const [logIn, { error }] = useMutation<LogInData, LogInVariables>(LOG_IN, {
    onCompleted: (data) => {
      if (data && data.logIn) {
        setViewer(data.logIn);

        if (data.logIn.token) {
          sessionStorage.setItem("token", data.logIn.token);
        } else {
          sessionStorage.removeItem("token");
        }
      }
    },
  });

  const logInRef = useRef(logIn);

  useEffect(() => {
    logInRef.current();
  }, []);

  if (!viewer.didRequest && !error) {
    return (
      <Layout className="app-skeleton">
        <AppHeaderSkeleton />
        <div className="app-skeleton__spin-section">
          <Spin size="large" tip="Launching Tinyhouse" />
        </div>
      </Layout>
    );
  }

  const logInErrorBannerElement = error ? (
    <ErrorBanner description="We weren't able to verify that you were logged in. Please try again later!" />
  ) : null;
  return (
    <Router>
      <Layout id="app">
        {logInErrorBannerElement}
        <Affix offsetTop={0} className="app__affix-header">
          <AppHeader viewer={viewer} setViewer={setViewer} />
        </Affix>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route exact path="/host">
            <Host viewer={viewer} />
          </Route>
          <Route exact path="/listing/:id">
            <Elements stripe={stripePromise}>
              <Listing viewer={viewer} />
            </Elements>
          </Route>
          <Route exact path="/listings/:location?">
            <Listings />
          </Route>
          <Route exact path="/login">
            <Login setViewer={setViewer} />
          </Route>
          <Route exact path="/stripe">
            <Stripe viewer={viewer} setViewer={setViewer} />
          </Route>
          <Route exact path="/user/:id">
            <User viewer={viewer} setViewer={setViewer} />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </Router>
  );
};

render(
  <ApolloProvider client={client}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </ApolloProvider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
