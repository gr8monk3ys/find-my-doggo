import Link from 'next/link';
import DogCard from '@/components/DogCard';
import { mockDogs } from '@/lib/mockData';

export default function Home() {
  const recentDogs = mockDogs.filter((dog) => dog.status !== 'reunited').slice(0, 3);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Help Reunite Lost Dogs
              <br />
              With Their Families
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-orange-100 max-w-3xl mx-auto">
              Every year, millions of dogs go missing. Our community-powered platform helps connect lost dogs with their
              owners through photo sharing and location mapping.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/report"
                className="bg-white text-orange-500 hover:bg-orange-50 font-bold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                Report a Dog
              </Link>
              <Link
                href="/dogs"
                className="bg-orange-700 hover:bg-orange-800 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                Browse Listings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 dark:bg-[#0a0a14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold text-orange-500 mb-2">1,000+</div>
              <div className="text-gray-600 dark:text-gray-400">Dogs Reunited</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-orange-500 mb-2">5,000+</div>
              <div className="text-gray-600 dark:text-gray-400">Active Listings</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-orange-500 mb-2">50+</div>
              <div className="text-gray-600 dark:text-gray-400">Cities Covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📷</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Upload a Photo</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Take a clear photo of the lost or found dog and upload it to our platform.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📍</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Add Location</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Mark where the dog was last seen or found on our interactive map.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔔</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Get Notified</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Receive alerts when potential matches are found in your area.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="py-16 bg-gray-50 dark:bg-[#0a0a14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Recent Listings</h2>
            <Link href="/dogs" className="text-orange-500 hover:text-orange-600 font-medium">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentDogs.map((dog) => (
              <DogCard key={dog.id} dog={dog} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Have You Seen a Lost Dog?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            If you&apos;ve found a dog or spotted one that looks lost, please report it. Your quick action could help
            reunite a family with their beloved pet.
          </p>
          <Link
            href="/report"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
          >
            Report Now
          </Link>
        </div>
      </section>
    </div>
  );
}
