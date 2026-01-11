import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        padding: '40px 20px', 
        textAlign: 'center', 
        fontSize: 16, 
        color: '#666' 
      }}>
        Cargando...
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/login" />;
}
