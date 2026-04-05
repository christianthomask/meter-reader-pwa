import { useState } from 'react';
import { Login } from './components/Login';
import { CitySelection } from './components/CitySelection';
import { Routes } from './components/Routes';
import { PhotoApproval } from './components/PhotoApproval';
import { SyncStatusBar } from './components/SyncStatusBar';
import { ClipboardList, ImageIcon, ChevronLeft, LogOut } from 'lucide-react';

interface City {
  id: string;
  name: string;
  region: string;
  activeRoutes: number;
  pendingPhotos: number;
}

type Screen = 'login' | 'city-selection' | 'main';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [username, setUsername] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [activeTab, setActiveTab] = useState<'routes' | 'photos'>('routes');
  const [pendingReadings] = useState(3); // Mock data for pending sync
  const [lastSync] = useState(new Date(Date.now() - 5 * 60000)); // 5 minutes ago

  const handleLogin = (user: string) => {
    setUsername(user);
    setCurrentScreen('city-selection');
  };

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setCurrentScreen('main');
  };

  const handleBack = () => {
    setCurrentScreen('city-selection');
    setSelectedCity(null);
  };

  const handleLogout = () => {
    setCurrentScreen('login');
    setUsername('');
    setSelectedCity(null);
    setActiveTab('routes');
  };

  if (currentScreen === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  if (currentScreen === 'city-selection') {
    return <CitySelection username={username} onSelectCity={handleCitySelect} />;
  }

  return (
    <div className="size-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-semibold">Meter Reading Manager</h1>
              {selectedCity && (
                <p className="text-sm text-blue-100">{selectedCity.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('routes')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 border-b-2 transition-colors ${
              activeTab === 'routes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600'
            }`}
          >
            <ClipboardList size={20} />
            <span>Routes</span>
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 border-b-2 transition-colors ${
              activeTab === 'photos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600'
            }`}
          >
            <ImageIcon size={20} />
            <span>Photos</span>
          </button>
        </div>
      </nav>

      {/* Sync Status Bar */}
      <SyncStatusBar pendingReadings={pendingReadings} lastSync={lastSync} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {activeTab === 'routes' ? <Routes /> : <PhotoApproval />}
      </main>
    </div>
  );
}