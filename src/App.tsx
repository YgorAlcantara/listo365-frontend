import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CartProvider } from '@/components/cart/CartProvider';
import { Header } from '@/components/Header';
import Home from '@/pages/Home';
import Checkout from '@/pages/Checkout';
import Login from '@/pages/Admin/Login';
import Dashboard from '@/pages/Admin/Dashboard';
import PrivateRoute from '@/components/PrivateRoute';
import { Toaster } from 'react-hot-toast';

export default function App() {
  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || '';
    if (base) fetch(`${base}/health`, { cache: 'no-store' }).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <CartProvider>
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </CartProvider>
    </BrowserRouter>
  );
}
