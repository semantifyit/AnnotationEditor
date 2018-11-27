import * as React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import '../styles/App.css';
import Home from './Home';
import AnnotationEditorPage from './AnnotationEditorPage';
import Navigation from './Navigation';

class App extends React.Component {
  public render() {
    return (
      <Router basename="/annotation">
        <>
          <Navigation />
          <div
            className="container"
            style={{ marginBottom: '200px', width: '100%' }}
          >
            <Route
              exact={true}
              path="/"
              className="btn btn-primary my-2"
              component={Home}
            />
            <Route
              path="/blank/"
              className="btn btn-primary my-2"
              render={() => <AnnotationEditorPage type="blank" />}
            />
            <Route
              path="/template/"
              className="btn btn-primary my-2"
              render={() => <AnnotationEditorPage type="template" />}
            />
            <Route
              path="/webApi/"
              className="btn btn-primary my-2"
              render={() => <AnnotationEditorPage type="webapi" />}
            />
          </div>
        </>
      </Router>
    );
  }
}

export default App;
