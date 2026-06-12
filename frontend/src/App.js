import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/Home';
import SearchPage from './pages/Search';
import DirectoryPage from './pages/Directory';
import AdminLogin from './pages/AdminLogin';

function AdminRoute({ children }) {
  return localStorage.getItem('adminToken') ? children : <Navigate to="/admin" replace />;
}

function App() {  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/directory" element={<AdminRoute><DirectoryPage /></AdminRoute>} />
          <Route path="/admin" element={<AdminLogin />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
