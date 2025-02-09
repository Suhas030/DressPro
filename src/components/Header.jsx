import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <section className="w3l-banner-slider-main">
      <div className="top-header-content">
        <header className="tophny-header">
          <nav className="navbar navbar-expand-lg navbar-light">
            <div className="container-fluid serarc-fluid">
              <Link className="navbar-brand" to="/">
                <span className="lohny">D</span>ress <span className="lohny">P</span>ro
              </Link>
              <button
                className="navbar-toggler"
                type="button"
                data-toggle="collapse"
                data-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon fa fa-bars"> </span>
              </button>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ml-auto">
                  <li className="nav-item active">
                    <Link className="nav-link" to="/">Home</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/find-clothes">Find clothes</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/rate-my-fit">Rate My Fit</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/profile">Profile</Link>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </header>
      </div>
    </section>
  );
}

export default Header;