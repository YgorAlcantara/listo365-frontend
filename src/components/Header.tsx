import { Link } from 'react-router-dom';
import { CartMenu } from '@/components/cart/CartMenu';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-semibold tracking-tight">
          <span className="text-emerald-600">Listo</span>365
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className="hover:text-emerald-700">Products</Link>
          <CartMenu />
        </nav>
      </div>
    </header>
  );
}
