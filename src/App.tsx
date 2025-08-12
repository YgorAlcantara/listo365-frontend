import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CartProvider } from '@/components/cart/CartProvider';
import { Header } from '@/components/Header';
import Home from '@/pages/Home';
import Checkout from '@/pages/Checkout';
import Login from '@/pages/Admin/Login';
import Dashboard from '@/pages/Admin/Dashboard';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<Dashboard />} />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </CartProvider>
    </BrowserRouter>
  );
}
