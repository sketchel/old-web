import React from 'react';
import { Header } from './components/header.component';
import { Feed } from './components/feed.component';
import './index.css';
import Canvas from './components/canvas.component';

function DrawApp() {
  return (
    <div className="App">
      <Header />
      <Canvas />
    </div>
  );
}

export default DrawApp;
