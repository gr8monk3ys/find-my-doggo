import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-3xl">🐕</span>
              <span className="text-xl font-bold text-orange-500">Find My Doggo</span>
            </div>
            <p className="text-gray-400">
              Helping reunite lost dogs with their families through community support and technology.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dogs" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Lost & Found Dogs
                </Link>
              </li>
              <li>
                <Link href="/report" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Report a Dog
                </Link>
              </li>
              <li>
                <Link href="/map" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Map View
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Tips for Finding Lost Dogs
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Pet Safety Guide
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Local Shelters
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Find My Doggo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
