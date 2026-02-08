import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white">
      
      <main>{children}</main>
    </div>
  );
}
