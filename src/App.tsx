import { useEffect } from "react";
import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { CartProvider } from "@/components/cart/CartProvider";
import { Header } from "@/components/Header";
import Home from "@/pages/Home";
import Checkout from "@/pages/Checkout";
import Login from "@/pages/Admin/Login";
import Dashboard from "@/pages/Admin/Dashboard";
import PrivateRoute from "@/components/PrivateRoute";
import { Toaster } from "react-hot-toast";
import AdminOrders from "@/pages/Admin/Orders";
import AdminLayout from "@/pages/Admin/AdminLayout";

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
          </Route>

          {/* Login do Admin (sem Header público) */}
          <Route path="/admin/login" element={<Login />} />

          {/* ROTAS ADMIN protegidas com PrivateRoute e usando AdminLayout */}
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
            {/* Quando criar o detalhe do pedido, descomente: */}
            {/* <Route path="orders/:id" element={<AdminOrderDetail />} /> */}
            {/* Espaço pra futuras telas: categories, promotions, customers... */}
          </Route>

          {/* Fallback opcional: redirecionar 404 para Home ou criar uma página NotFound */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>

        <Toaster position="top-right" />
      </CartProvider>
    </BrowserRouter>
  );
}
