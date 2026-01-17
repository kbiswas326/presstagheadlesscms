
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black text-gray-900 tracking-tight">
          Press<span className="text-blue-600">Tag</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 font-medium text-gray-600">
          <Link href="/" className="hover:text-blue-600 transition">Home</Link>
          <Link href="#" className="hover:text-blue-600 transition">Cricket</Link>
          <Link href="#" className="hover:text-blue-600 transition">Football</Link>
          <Link href="#" className="hover:text-blue-600 transition">About</Link>
        </div>
        <button className="md:hidden">
          <span className="sr-only">Menu</span>
          ☰
        </button>
      </div>
    </nav>
  );
}
