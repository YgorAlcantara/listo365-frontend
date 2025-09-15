// src/App.tsx
import { useEffect } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  Outlet,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { CartProvider } from "@/components/cart/CartProvider";
import { Header } from "@/components/Header";
import PrivateRoute from "@/components/PrivateRoute";

// 👉 novos imports
import AccentBar from "@/components/ui/AccentBar";
import GetInTouch from "@/components/GetInTouch"; // default export (GetInTouchLine)
import Footer from "@/components/Footer";

// Public pages
import Home from "@/pages/Home";
import Checkout from "@/pages/Checkout";
import ProductPage from "@/pages/ProductPage";

// Admin pages
import Login from "@/pages/Admin/Login";
import AdminLayout from "@/pages/Admin/AdminLayout";
import Dashboard from "@/pages/Admin/Dashboard";
import AdminOrders from "@/pages/Admin/Orders";
import AdminOrderDetail from "@/pages/Admin/AdminOrderDetail";
import Categories from "@/pages/Admin/Categories";
import Promotions from "@/pages/Admin/Promotions";

// Layout para rotas públicas (Header + barra + conteúdo + CTA + footer)
function PublicShell() {
  return (
    <>
      <Header />
      {/* barra degradê laranja→vermelho */}
      <AccentBar />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>

      {/* CTA antes do rodapé (apenas no público) */}
      <section className="-mb-8">
        <GetInTouch />
      </section>
      <Footer />
    </>
  );
}

export default function App() {
  // Warm-up do backend para evitar cold start (sem CORS em produção)
  useEffect(() => {
    const isLocal =
      typeof window !== "undefined" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

    const health = isLocal
      ? "http://localhost:4000/health"
      : "/api/health"; // via proxy do Vercel

    fetch(health, { cache: "no-store", mode: "no-cors" }).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* PUBLIC ROUTES com layout público */}
          <Route element={<PublicShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/product/:idOrSlug" element={<ProductPage />} />
          </Route>

          {/* ADMIN LOGIN (sem PublicShell) */}
          <Route path="/admin/login" element={<Login />} />

          {/* ADMIN ROUTES (sem GetInTouch/Footer) */}
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
            <Route path="categories" element={<Categories />} />
            <Route path="promotions" element={<Promotions />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster position="top-right" />
      </CartProvider>
    </BrowserRouter>
  );
}