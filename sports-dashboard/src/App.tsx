import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="main-content">
          <Dashboard activeView={activeView} />
        </main>
      </div>
    </div>
  );
}

export default App;