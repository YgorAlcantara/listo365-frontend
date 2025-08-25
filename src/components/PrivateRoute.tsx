// src/components/PrivateRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "@/services/auth";
import type { PropsWithChildren } from "react";

export default function PrivateRoute({ children }: PropsWithChildren) {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
