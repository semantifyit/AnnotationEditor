import * as React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import '../styles/App.css';
import AnnotationWebApi from './AnnotationWebApi';
import AnnotationBlank from './AnnotationBlank';
import Home from './Home';
import AnnotationTemplate from './AnnotationTemplate';

class App extends React.Component {
  public render() {
    return (
      <Router basename="/annotation">
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
            path="/webApi/"
            className="btn btn-primary my-2"
            component={AnnotationWebApi}
          />
          <Route
            path="/template/"
            className="btn btn-primary my-2"
            component={AnnotationTemplate}
          />
          <Route
            path="/blank/"
            className="btn btn-primary my-2"
            component={AnnotationBlank}
          />
        </div>
      </Router>
    );
  }
}

export default App;
