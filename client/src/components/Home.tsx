import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => (
  <div className="text-center ml-auto mr-auto" style={{ maxWidth: '40rem' }}>
    <h1>Semantify Actions</h1>
    <p>
      Welcome to Semantify's Schema.org Actions, the place where we semantically
      enhance Web APIs with the use for Schema.org Actions
    </p>
    <Link to="/webAPI" className="btn btn-lg btn-primary">
      Get Started
    </Link>
  </div>
);
export default Home;
