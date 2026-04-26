import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PriceBook from './pages/PriceBook';
import Inventory from './pages/Inventory';
import Fuel from './pages/Fuel';
import Promotions from './pages/Promotions';
import Reconciliation from './pages/Reconciliation';
import POS from './pages/POS';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/price-book" element={<PriceBook />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/fuel" element={<Fuel />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/reconciliation" element={<Reconciliation />} />
              <Route path="/pos" element={<POS />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
