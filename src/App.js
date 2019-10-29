import React from 'react';
import { Header } from './components/header.component';
import { Feed } from './components/feed.component';
import './index.css';

function App() {
  return (
    <div className="App">
      <Header />
      <Feed />
    </div>
  );
}

export default App;
