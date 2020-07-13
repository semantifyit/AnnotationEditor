import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaExternalLinkAlt } from 'react-icons/fa';

import '../styles/home.css';

interface Props {
  headerClass: string;
}

const HomeNav = ({ headerClass }: Props) => (
  <header className={headerClass}>
    <h3
      style={{
        float: 'left',
        marginBottom: 0,
        fontWeight: 'bold',
      }}
    >
      Semantify Actions
    </h3>
    <nav style={{ float: 'right' }} className="nav nav-masthead justify-content-center">
      <NavLink exact className="nav-link" activeClassName="active" to="/">
        Home
      </NavLink>
      <NavLink exact className="nav-link" activeClassName="active" to="/webAPI">
        Web Apis
      </NavLink>
      <NavLink exact className="nav-link" activeClassName="active" to="/actionLink">
        Action Links
      </NavLink>
      <NavLink className="nav-link" activeClassName="active" to="/about">
        About
      </NavLink>
      <NavLink className="nav-link" activeClassName="active" to="/docs">
        Docs
      </NavLink>
      <a className="nav-link" href="https://semantify.it/" target="_blank" rel="noopener noreferrer">
        Semantify.it <FaExternalLinkAlt />
      </a>
    </nav>
  </header>
);

export default HomeNav;
