import * as React from 'react';
import { Link } from 'react-router-dom';

class App extends React.Component {
  public render() {
    return (
      <div>
        <section
          className="jumbotron text-center"
          style={{ backgroundColor: '#fff' }}
        >
          <div className="container">
            <h1 className="jumbotron-heading">Welcome to semantify actions!</h1>
            <p className="lead  text-muted">
              Use schema.org Actions to semantically connect
              <br />
            </p>
            <a href="/vocab" className="btn btn-primary margin5">
              API Documentation Vocabulary
            </a>
            <a href="/api-docs" className="btn btn-primary margin5">
              Take a look at our API
            </a>
            <h3 style={{ marginTop: '50px' }}>Create Annotations: </h3>
            <Link to="/annotation/webApi/" className="btn btn-primary margin5">
              Semantic WebApi
            </Link>
            <Link
              to="/annotation/template/"
              className="btn btn-primary margin5"
            >
              From Template
            </Link>
            <Link to="/annotation/blank/" className="btn btn-primary margin5">
              Blank Annotation
            </Link>
          </div>
        </section>
      </div>
    );
  }
}

export default App;
