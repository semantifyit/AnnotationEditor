import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Home from './Home';
import WebApiList from './WebApiList';
import About from './About';
import Docs from './Docs';
import WebApiCreate from './webApiDetails/WebApiCreate';
import Page from './Page';
import ActionLinkPage from './ActionLinkPage';

const AppRouter = () => (
  <>
    <Router>
      <Switch>
        <Route path={['/webAPI/new', '/webAPI/:id/view', '/webAPI/:id/edit']} exact>
          <WebApiCreate />
        </Route>

        <Route exact path="/">
          <Page headerClass="mb-auto">
            <Route path="/" exact>
              <Home />
            </Route>
          </Page>
        </Route>

        <Route path="/">
          <Page headerClass="mb-4r">
            <Route path="/about/" exact>
              <About />
            </Route>
            <Route path="/docs/" exact>
              <Docs />
            </Route>
            <Route path="/webAPI/" exact>
              <WebApiList />
            </Route>
            <Route path="/actionLink/" exact>
              <ActionLinkPage />
            </Route>
          </Page>
        </Route>
      </Switch>
    </Router>
  </>
);

export default AppRouter;
