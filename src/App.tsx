import { useEffect } from "react";
import { BrowserRouter, Route, Routes, Outlet, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { CartProvider } from "@/components/cart/CartProvider";
import { Header } from "@/components/Header";
import PrivateRoute from "@/components/PrivateRoute";

import AccentBar from "@/components/ui/AccentBar";
import GetInTouch from "@/components/GetInTouch";
import Footer from "@/components/Footer";

import Home from "@/pages/Home";
import Checkout from "@/pages/Checkout";
import ProductPage from "@/pages/ProductPage";

import Login from "@/pages/Admin/Login";
import AdminLayout from "@/pages/Admin/AdminLayout";
import Dashboard from "@/pages/Admin/Dashboard";
import AdminOrders from "@/pages/Admin/Orders";
import AdminOrderDetail from "@/pages/Admin/AdminOrderDetail";
import Categories from "@/pages/Admin/Categories";
import Promotions from "@/pages/Admin/Promotions";

import { api } from "@/services/api";

function PublicShell() {
  return (
    <>
      <Header />
      <AccentBar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
      <section className="-mb-8">
        <GetInTouch />
      </section>
      <Footer />
    </>
  );
}

export default function App() {
  useEffect(() => {
    // Health check: acorda o backend no Render (ou local)
    const base =
      (window.__API_BASE__ ||
        import.meta.env.VITE_API_BASE_URL ||
        "https://api.listo365cleaningsolutions.com").replace(/\/+$/, "");

    fetch(`${base}/health`, { cache: "no-store" })
      .then(() => console.log("✅ Backend health checked:", base))
      .catch((err) => console.warn("⚠️ Health check failed:", err));

    // Também força inicialização do cliente axios configurado
    api.get("/health").catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route element={<PublicShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/product/:idOrSlug" element={<ProductPage />} />
          </Route>

          <Route path="/admin/login" element={<Login />} />

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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster position="top-right" />
      </CartProvider>
    </BrowserRouter>
  );
}
