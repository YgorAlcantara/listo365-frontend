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

// Layout for public routes (Header + container)
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
  // Small warm-up so the first interaction feels snappy
  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
    fetch(`${base}/health`, { cache: "no-store" }).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* PUBLIC ROUTES with shared layout */}
          <Route element={<PublicShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/checkout" element={<Checkout />} />
            {/* IMPORTANT: param name is idOrSlug (camel-cased S) */}
            <Route path="/product/:idOrSlug" element={<ProductPage />} />
          </Route>

          {/* ADMIN LOGIN (no public header) */}
          <Route path="/admin/login" element={<Login />} />

          {/* ADMIN ROUTES (guarded) */}
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

          {/* Catch-all -> Home (or plug a dedicated 404 page later) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster position="top-right" />
      </CartProvider>
    </BrowserRouter>
  );
}
