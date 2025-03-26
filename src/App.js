import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LeaderManagement from './pages/LeaderManagement';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LeaderManagement />} />
    </Routes>
  );
};

export default App; 