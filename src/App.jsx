// import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Homepage from './components/Homepage';
import Header from './components/Header';
import Footer from './components/Footer';
import RateMyFit from './components/RateMyFit';

import './css/style-starter.css';
// import './css/App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="#" element={<div>Find Clothes Page</div>} />
            <Route path="/rate-my-fit" element={<RateMyFit />} />
            <Route path="#" element={<div>Profile Page</div>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App
