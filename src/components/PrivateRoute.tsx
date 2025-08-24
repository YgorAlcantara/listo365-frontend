import { Navigate, Outlet } from "react-router-dom";
import { isAuthed } from "@/services/auth";

export default function PrivateRoute() {
  return isAuthed() ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
