import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DocumentProvider } from './context/DocumentContext';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import './index.css';

import Dashboard from './pages/Dashboard';
import DocumentLog from './pages/DocumentLog';
import DocumentEntry from './pages/DocumentEntry';
import ManageUsers from './pages/ManageUsers';


const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route
        path="/log"
        element={<ProtectedRoute><Layout><DocumentLog /></Layout></ProtectedRoute>}
      />
      <Route
        path="/entry"
        element={<ProtectedRoute><Layout><DocumentEntry /></Layout></ProtectedRoute>}
      />
      <Route
        path="/edit/:id"
        element={<ProtectedRoute><Layout><DocumentEntry /></Layout></ProtectedRoute>}
      />
      <Route
        path="/users"
        element={<ProtectedRoute><Layout><ManageUsers /></Layout></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};


const App = () => {
  return (
    <AuthProvider>
      <DocumentProvider>
        <Router>
          <div className="app-container">
            <AppContent />
          </div>
        </Router>
      </DocumentProvider>
    </AuthProvider>
  );
};

export default App;

