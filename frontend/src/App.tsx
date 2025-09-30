import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import components
import Layout from './components/Layout/Layout';
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ProjectSelection from './pages/ProjectSelection/ProjectSelection';
import Dashboard from './pages/Dashboard/Dashboard';
import Orders from './pages/Orders/Orders';
import OrderStatuses from './pages/Orders/OrderStatuses';
import Products from './pages/Products/Products';
import Projects from './pages/Projects/Projects';
import Statistics from './pages/Statistics/Statistics';
import Telephony from './pages/Telephony/Telephony';
import CPA from './pages/CPA/CPA';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#007bff',
    },
    secondary: {
      main: '#6c757d',
    },
    background: {
      default: '#f8f9fa',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes - Project Selection */}
              <Route 
                path="/project-selection" 
                element={
                  <ProtectedRoute>
                    <ProjectSelection />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected routes - Main Application */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="order-statuses" element={<OrderStatuses />} />
                <Route path="products" element={<Products />} />
                <Route path="projects" element={<Projects />} />
                <Route path="statistics" element={<Statistics />} />
                <Route path="telephony" element={<Telephony />} />
                <Route path="cpa" element={<CPA />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;