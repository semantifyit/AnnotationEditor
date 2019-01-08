import * as React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import '../styles/App.css';
import Home from './Home';
import AnnotationEditorPage from './AnnotationEditorPage';
import Navigation from './Navigation';
import Mapping from './Mapping/Mapping';
import { sampleAnnotation } from './Mapping/SampleAnnotation';

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
            <Route exact={true} path="/" component={Home} />
            <Route
              path="/blank/"
              render={() => <AnnotationEditorPage type="blank" />}
            />
            <Route
              path="/template/"
              render={() => <AnnotationEditorPage type="template" />}
            />
            <Route
              path="/webApi/"
              render={() => <AnnotationEditorPage type="webapi" />}
            />
            <Route
              path="/mapping/"
              render={() => <Mapping annotation={sampleAnnotation} />}
            />
          </div>
        </>
      </Router>
    );
  }
}

export default App;
