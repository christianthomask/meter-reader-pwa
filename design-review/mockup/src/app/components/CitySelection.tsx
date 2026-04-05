import { MapPin, ChevronRight, Droplets } from 'lucide-react';

interface City {
  id: string;
  name: string;
  region: string;
  activeRoutes: number;
  pendingPhotos: number;
}

interface CitySelectionProps {
  username: string;
  onSelectCity: (city: City) => void;
}

const cities: City[] = [
  { id: '1', name: 'Springfield', region: 'North Region', activeRoutes: 8, pendingPhotos: 12 },
  { id: '2', name: 'Riverside', region: 'East Region', activeRoutes: 5, pendingPhotos: 4 },
  { id: '3', name: 'Lakewood', region: 'West Region', activeRoutes: 6, pendingPhotos: 8 },
  { id: '4', name: 'Hillside', region: 'South Region', activeRoutes: 4, pendingPhotos: 2 },
  { id: '5', name: 'Meadowbrook', region: 'Central Region', activeRoutes: 7, pendingPhotos: 15 },
];

export function CitySelection({ username, onSelectCity }: CitySelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
            <Droplets size={32} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome, {username}!</h1>
          <p className="text-blue-100">Select your city to continue</p>
        </div>

        {/* City Cards */}
        <div className="space-y-3">
          {cities.map(city => (
            <button
              key={city.id}
              onClick={() => onSelectCity(city)}
              className="w-full bg-white rounded-xl shadow-lg p-5 text-left hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={20} className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{city.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{city.region}</p>

                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Routes: </span>
                      <span className="font-semibold text-gray-900">{city.activeRoutes}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pending: </span>
                      <span className="font-semibold text-orange-600">{city.pendingPhotos}</span>
                    </div>
                  </div>
                </div>

                <ChevronRight size={24} className="text-gray-400 ml-2" />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-blue-100 text-sm">
            Select a city to view routes and approve photos
          </p>
        </div>
      </div>
    </div>
  );
}
