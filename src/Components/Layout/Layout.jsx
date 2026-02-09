import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    // ЗМІНИ: h-screen (фіксована висота), overflow-hidden (без скролу), bg-black
    <div className="h-screen w-screen bg-black overflow-hidden text-white">
      <main className="w-full h-full">{children}</main>
    </div>
  );
}