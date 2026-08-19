import Link from 'next/link';

const SITE_LINKS = [
  { href: '/dogs', label: 'Lost & found dogs' },
  { href: '/report', label: 'Report a dog' },
  { href: '/map', label: 'Map' },
  { href: '/contact', label: 'Contact' },
];

const RESOURCES = [
  { href: 'https://www.aspca.org/pet-care/general-pet-care/lost-pet', label: 'ASPCA: lost pet advice' },
  {
    href: 'https://www.akc.org/expert-advice/lifestyle/what-to-do-if-your-dog-is-lost/',
    label: 'AKC: what to do if your dog is lost',
  },
  { href: 'https://www.petfinder.com/animal-shelters-and-rescues/search/', label: 'Find a local shelter' },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-3xl" aria-hidden="true">
                🐕
              </span>
              <span className="text-xl font-bold text-orange-500">Find My Doggo</span>
            </div>
            <p className="text-gray-400">
              A community noticeboard for lost and found dogs. Free to use, no account needed.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Site</h2>
            <ul className="space-y-2">
              {SITE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-orange-500 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Resources</h2>
            <ul className="space-y-2">
              {RESOURCES.map((resource) => (
                <li key={resource.href}>
                  <a
                    href={resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {resource.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>
            Find My Doggo is open source under the GPL-3.0 licence.{' '}
            <a
              href="https://github.com/gr8monk3ys/find-my-doggo"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-500 transition-colors underline"
            >
              View the source on GitHub
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
