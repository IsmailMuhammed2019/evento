import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex space-x-8">
          <Link
            href="/"
            className={`py-4 px-2 border-b-2 font-medium text-sm ${
              pathname === "/"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Attendance Scanner
          </Link>
          <Link
            href="/generate"
            className={`py-4 px-2 border-b-2 font-medium text-sm ${
              pathname === "/generate"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Generate QR Code
          </Link>
        </div>
      </div>
    </nav>
  );
}
