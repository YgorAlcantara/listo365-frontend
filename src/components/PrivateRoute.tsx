import { PropsWithChildren, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "@/services/auth";

/**
 * Gate for admin-only routes.
 * - If there's no JWT token, redirect to /admin/login and preserve the `from` location.
 * - AdminLayout itself validates the token via /auth/me, so this stays lean + fast.
 */
export default function PrivateRoute({ children }: PropsWithChildren) {
  const location = useLocation();
  const token = useMemo(() => getToken(), []);

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
