import { Navigate } from 'react-router-dom';
import { isAuthed } from '@/services/auth';

export default function PrivateRoute({ children }: { children: JSX.Element }) {
  return isAuthed() ? children : <Navigate to="/admin/login" replace />;
}
