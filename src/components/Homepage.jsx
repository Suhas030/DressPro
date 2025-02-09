import React from 'react';
import { Link } from 'react-router-dom';

function Homepage() {
  return (
    <>
      <section className="w3l-banner-slider-main">
        <div className="top-header-content">
          <div className="bannerhny-content">
            <div className="content-baner-inf">
              <div id="carouselExampleIndicators" className="carousel slide" data-ride="carousel">
                <ol className="carousel-indicators">
                  <li data-target="#carouselExampleIndicators" data-slide-to="0" className="active"></li>
                </ol>
                <div className="carousel-inner">
                  <div className="carousel-item active">
                    <div className="container">
                      <div className="carousel-caption">
                        <h3>
                          Find Your<br />Perfect Style
                        </h3>
                        <Link to="/find-clothes" className="shop-button btn">
                          Find Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="right-banner">
              <div className="right-1">
                <h4>
                  Rate<br />My Fit
                </h4>
                <Link to="/rate-my-fit" className="shop-button btn">
                  Get Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="w3l-content-w-photo-6">
        <div className="content-photo-6-mian py-5">
          <div className="container py-lg-5">
            <div className="align-photo-6-inf-cols row">
              <div className="photo-6-inf-right col-lg-6">
                <h3 className="hny-title text-left">All Branded Men's Suits are Flat <span>30% Discount</span></h3>
                <p>Visit our shop to see amazing creations from our designers.</p>
                <Link to="/shop" className="read-more btn">
                  Shop Now
                </Link>
              </div>
              <div className="photo-6-inf-left col-lg-6">
                <img src="/images/1.jpg" className="img-fluid" alt="" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w3l-wecome-content-6">
        <div className="ab-content-6-mian py-5">
          <div className="container py-lg-5">
            <div className="welcome-grids row">
              <div className="col-lg-6 mb-lg-0 mb-5">
                <h3 className="hny-title">
                  About Our <span>W</span>estern<span>F</span>ashion<span>S</span>hop
                </h3>
                <p className="my-4">
                  Elevate your looks with…<br />
                  Accessories for your party attire to style with AND's trendy and timeless collection
                </p>
                <div className="read">
                  <Link to="/shop" className="read-more btn">
                    Shop Now
                  </Link>
                </div>
              </div>
              <div className="col-lg-6 welcome-image">
                <img src="/images/2.jpg" className="img-fluid" alt="" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w3l-specification-6">
        <div className="specification-6-mian py-5">
          <div className="container py-lg-5">
            <div className="row story-6-grids text-left">
              <div className="col-lg-5 story-gd">
                <img src="/images/left2.jpg" className="img-fluid" alt="/" />
              </div>
              <div className="col-lg-7 story-gd pl-lg-4">
                <h3 className="hny-title">What We <span>Offer</span></h3>
                <p>To do this, I will open the option to follow the option to follow the apisisic elit.Fuga, he receives the
                  whole result of the mind, often with flattery.
                  Flee, he receives the whole result of the mind often flattery.</p>
                <div className="row story-info-content mt-md-5 mt-4">
                  <div className="col-md-6 story-info">
                    <h5><Link to="#">01. Visit Store</Link></h5>
                    <p>To do this, I will open the option to follow the adipisicing elitFuga, it takes all the results of
                      the mind..</p>
                  </div>
                  <div className="col-md-6 story-info">
                    <h5><Link to="#">02. Add To Cart</Link></h5>
                    <p>To do this, I will open the option to follow the adipisicing elitFuga, it takes all the results of
                      the mind.</p>
                  </div>
                  <div className="col-md-6 story-info">
                    <h5><Link to="#">03. Gift Cards</Link></h5>
                    <p>To do this, I will open the option to follow the adipisicing elitFuga, it takes all the results of
                      the mind.</p>
                  </div>
                  <div className="col-md-6 story-info">
                    <h5><Link to="#">04. Unique shop</Link></h5>
                    <p>To do this, I will open the option to follow the adipisicing elitFuga, it takes all the results of
                      the mind.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Homepage;