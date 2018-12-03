import * as React from 'react';
import { Link } from 'react-router-dom';

class App extends React.Component {
  public render() {
    return (
      <div>
        <section className="jumbotron text-center">
          <div className="container">
            <h1 className="jumbotron-heading">
              Welcome to The Annotation Editor!
            </h1>
            <h3 style={{ marginTop: '50px' }}>Create Annotations</h3>
            <Link to="/webApi/" className="btn btn-primary margin5">
              Semantic WebApi
            </Link>
            <Link to="/template/" className="btn btn-primary margin5">
              From Template
            </Link>
            <Link to="/blank/" className="btn btn-primary margin5">
              Blank Annotation
            </Link>
          </div>
        </section>
      </div>
    );
  }
}

export default App;
