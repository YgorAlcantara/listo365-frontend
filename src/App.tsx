// src/App.tsx
import { useEffect } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  Outlet,
  Navigate,
} from "react-router-dom";
import { CartProvider } from "@/components/cart/CartProvider";
import { Header } from "@/components/Header";

import Home from "@/pages/Home";
import Checkout from "@/pages/Checkout";

import Login from "@/pages/Admin/Login";
import Dashboard from "@/pages/Admin/Dashboard";
import AdminOrders from "@/pages/Admin/Orders";
import AdminOrderDetail from "@/pages/Admin/AdminOrderDetail";
import AdminLayout from "@/pages/Admin/AdminLayout";
import ProductPage from "@/pages/ProductPage";

import PrivateRoute from "@/components/PrivateRoute";
import { Toaster } from "react-hot-toast";

// Se tiver estas páginas criadas, importe e descomente as rotas:
import Categories from "@/pages/Admin/Categories";
import Promotions from "@/pages/Admin/Promotions";

// Layout público: Header + container padrão
function PublicShell() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  // pre-warm do backend
  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || "";
    if (base) fetch(`${base}/health`, { cache: "no-store" }).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* ROTAS PÚBLICAS com layout público */}
          <Route element={<PublicShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/p/:slug" element={<ProductPage />} />
          </Route>

          {/* Login do Admin (sem Header público) */}
          <Route path="/admin/login" element={<Login />} />

          {/* ROTAS ADMIN protegidas e com layout do admin */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            {/* Descomente se existirem as páginas */}
            <Route path="categories" element={<Categories />} />
            <Route path="promotions" element={<Promotions />} />
          </Route>

          {/* Fallback 404 -> Home (ou crie uma NotFound) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster position="top-right" />
      </CartProvider>
    </BrowserRouter>
  );
}
