'use client';

import { useState } from 'react';
import { mockDogs } from '@/lib/mockData';
import { Dog } from '@/lib/types';
import Link from 'next/link';

export default function MapPage() {
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');

  const filteredDogs = mockDogs.filter((dog) => {
    if (filter === 'all') return dog.status !== 'reunited';
    return dog.status === filter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Map View</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View lost and found dogs on the map. Click on a marker to see details.
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        {['all', 'lost', 'found'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as 'all' | 'lost' | 'found')}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {f === 'all' ? 'All Dogs' : f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Placeholder */}
        <div className="lg:col-span-2">
          <div className="bg-gray-100 dark:bg-[#1a1a2e] rounded-xl h-[500px] relative overflow-hidden">
            {/* Simulated Map Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/20 dark:to-green-900/20">
              <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                </pattern>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>

            {/* Dog Markers */}
            {filteredDogs.map((dog, index) => {
              const positions = [
                { top: '20%', left: '30%' },
                { top: '40%', left: '60%' },
                { top: '60%', left: '25%' },
                { top: '35%', left: '75%' },
                { top: '70%', left: '50%' },
                { top: '25%', left: '45%' },
              ];
              const pos = positions[index % positions.length];

              return (
                <button
                  key={dog.id}
                  onClick={() => setSelectedDog(dog)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 ${
                    selectedDog?.id === dog.id ? 'scale-125 z-10' : ''
                  }`}
                  style={{ top: pos.top, left: pos.left }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                      dog.status === 'lost' ? 'bg-red-500' : 'bg-green-500'
                    }`}
                  >
                    <span className="text-xl">🐕</span>
                  </div>
                  <div
                    className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent ${
                      dog.status === 'lost' ? 'border-t-red-500' : 'border-t-green-500'
                    }`}
                  />
                </button>
              );
            })}

            {/* Map Attribution Notice */}
            <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 px-3 py-2 rounded-lg text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                Interactive map preview
                <br />
                <span className="text-xs">Connect a maps API for full functionality</span>
              </p>
            </div>
          </div>
        </div>

        {/* Dog List / Details */}
        <div className="space-y-4">
          {selectedDog ? (
            <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-lg p-5">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{selectedDog.name}</h3>
                <button onClick={() => setSelectedDog(null)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                  selectedDog.status === 'lost' ? 'status-lost' : 'status-found'
                }`}
              >
                {selectedDog.status === 'lost' ? 'Lost' : 'Found'}
              </span>
              <p className="text-orange-500 font-medium mb-2">{selectedDog.breed}</p>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{selectedDog.description}</p>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {selectedDog.location.address}
              </div>
              <Link
                href={`mailto:${selectedDog.contactEmail}`}
                className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Contact
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-lg p-5">
              <h3 className="text-lg font-semibold mb-4">Dogs in this area</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {filteredDogs.map((dog) => (
                  <button
                    key={dog.id}
                    onClick={() => setSelectedDog(dog)}
                    className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{dog.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          dog.status === 'lost' ? 'status-lost' : 'status-found'
                        }`}
                      >
                        {dog.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{dog.breed}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{dog.location.address}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-lg p-4">
            <h4 className="font-medium mb-3">Legend</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2" />
                <span>Lost Dogs</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2" />
                <span>Found Dogs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
