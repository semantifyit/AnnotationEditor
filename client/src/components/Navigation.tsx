import * as React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import logo from '../images/logo_image.png';
import semantify from '../images/logo_text.png';

// tslint:disable-next-line
const Navigation = () => (
  <nav className="navbar navbar-expand-lg navbar-light bg-light">
    <Link to="/">
      <FontAwesomeIcon icon="home" size="lg" /> Annotation Editor
    </Link>
    <ul className="navbar-nav ml-auto">
      <li className="nav-item">
        <a
          className="nav-link"
          href="https://semantify.it/"
          target="_blank"
          style={{ paddingTop: '0', paddingBottom: '0' }}
        >
          <span
            style={{
              fontSize: '1.6em',
              fontStyle: 'italic',
            }}
          >
            Powered by
          </span>
          &emsp;
          <img src={logo} style={{ height: '60px' }} />
          &emsp;
          <img
            src={semantify}
            style={{ filter: 'invert(1)', height: '50px' }}
          />
        </a>
      </li>
    </ul>
  </nav>
);

export default Navigation;
