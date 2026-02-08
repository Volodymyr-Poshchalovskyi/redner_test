import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-gray-200 dark:bg-gray-800 p-4 flex gap-4">
      <Link to="/" className="text-black dark:text-white">Home</Link>
      <Link to="/about" className="text-black dark:text-white">About</Link>
      <Link to="/contact" className="text-black dark:text-white">Contact</Link>
    </nav>
  );
}
