import { useState } from 'react';
import { UserPlus, MapPin, User, AlertTriangle, CloudOff, CheckCircle, Plus } from 'lucide-react';
import { MeterReadingForm } from './MeterReadingForm';

interface Reader {
  id: string;
  name: string;
  available: boolean;
}

interface Route {
  id: string;
  name: string;
  area: string;
  meterCount: number;
  assignedTo: string | null;
  readMostBy: string;
  status: 'unassigned' | 'assigned' | 'in-progress' | 'completed';
  metersRead?: number;
  rechecksDetected?: number;
  syncStatus?: 'synced' | 'pending' | 'failed';
}

const mockReaders: Reader[] = [
  { id: '1', name: 'John Smith', available: true },
  { id: '2', name: 'Sarah Johnson', available: true },
  { id: '3', name: 'Mike Davis', available: false },
  { id: '4', name: 'Emily Chen', available: true },
];

const initialRoutes: Route[] = [
  { id: '1', name: 'Route A1', area: 'Downtown North', meterCount: 45, assignedTo: null, readMostBy: 'Sarah Johnson', status: 'unassigned', metersRead: 0, rechecksDetected: 0, syncStatus: 'synced' },
  { id: '2', name: 'Route A2', area: 'Downtown South', meterCount: 52, assignedTo: 'John Smith', readMostBy: 'John Smith', status: 'assigned', metersRead: 0, rechecksDetected: 0, syncStatus: 'synced' },
  { id: '3', name: 'Route B1', area: 'West End', meterCount: 38, assignedTo: null, readMostBy: 'Emily Chen', status: 'unassigned', metersRead: 0, rechecksDetected: 0, syncStatus: 'synced' },
  { id: '4', name: 'Route B2', area: 'East Side', meterCount: 61, assignedTo: 'Sarah Johnson', readMostBy: 'Sarah Johnson', status: 'in-progress', metersRead: 42, rechecksDetected: 3, syncStatus: 'pending' },
  { id: '5', name: 'Route C1', area: 'North Park', meterCount: 29, assignedTo: 'Mike Davis', readMostBy: 'Mike Davis', status: 'completed', metersRead: 29, rechecksDetected: 1, syncStatus: 'synced' },
];

export function Routes() {
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReadingForm, setShowReadingForm] = useState(false);

  const handleAssign = (readerId: string) => {
    const reader = mockReaders.find(r => r.id === readerId);
    if (reader && selectedRoute) {
      setRoutes(prev =>
        prev.map(route =>
          route.id === selectedRoute
            ? { ...route, assignedTo: reader.name, status: 'assigned' as const }
            : route
        )
      );
      setShowAssignModal(false);
      setSelectedRoute(null);
    }
  };

  const openAssignModal = (routeId: string) => {
    setSelectedRoute(routeId);
    setShowAssignModal(true);
  };

  const getStatusColor = (status: Route['status']) => {
    switch (status) {
      case 'unassigned': return 'bg-gray-100 text-gray-700';
      case 'assigned': return 'bg-blue-100 text-blue-700';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Reading Routes</h2>
          <p className="text-sm text-gray-600">Assign routes to meter readers</p>
        </div>
        <button
          onClick={() => setShowReadingForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Demo Reading</span>
        </button>
      </div>

      <div className="space-y-3">
        {routes.map(route => (
          <div
            key={route.id}
            className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${
              route.status === 'completed' ? 'opacity-60 bg-gray-50' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{route.name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                  <MapPin size={14} />
                  <span>{route.area}</span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(route.status)}`}>
                {route.status.replace('-', ' ')}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm mb-3">
              <div className="flex items-center gap-1 text-gray-600">
                <User size={14} />
                <span>Read most by: {route.readMostBy}</span>
              </div>
              <span className="text-gray-600">{route.meterCount} meters</span>
            </div>

            {/* Progress and sync status for active routes */}
            {route.status === 'in-progress' && route.metersRead !== undefined && (
              <div className="mb-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">
                    {route.metersRead} / {route.meterCount} read
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(route.metersRead / route.meterCount) * 100}%` }}
                  />
                </div>

                {/* Rechecks and sync status */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                    {route.rechecksDetected && route.rechecksDetected > 0 && (
                      <div className="flex items-center gap-1 text-xs text-orange-600">
                        <AlertTriangle size={14} />
                        <span>{route.rechecksDetected} rechecks</span>
                      </div>
                    )}
                    {route.syncStatus === 'pending' && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <CloudOff size={14} />
                        <span>Pending sync</span>
                      </div>
                    )}
                    {route.syncStatus === 'synced' && route.metersRead && route.metersRead > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle size={14} />
                        <span>Synced</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {route.status === 'completed' && route.metersRead !== undefined && (
              <div className="mb-3 space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Completed: {route.metersRead} meters</span>
                  {route.rechecksDetected && route.rechecksDetected > 0 && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <AlertTriangle size={14} />
                      <span>{route.rechecksDetected} rechecks</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {route.assignedTo ? (
              <div className="flex items-center gap-2 text-sm">
                <UserPlus size={16} className="text-blue-600" />
                <span className="text-gray-700">Assigned to: <span className="font-medium">{route.assignedTo}</span></span>
              </div>
            ) : (
              <button
                onClick={() => openAssignModal(route.id)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus size={18} />
                Assign Reader
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Select Reader</h3>
            </div>
            <div className="p-4 space-y-2">
              {mockReaders.map(reader => (
                <button
                  key={reader.id}
                  onClick={() => handleAssign(reader.id)}
                  className="w-full p-4 rounded-lg border text-left transition-colors border-gray-200 hover:border-blue-600 hover:bg-blue-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{reader.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      reader.available ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {reader.available ? 'Available' : 'On route'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedRoute(null);
                }}
                className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meter Reading Form Demo */}
      {showReadingForm && (
        <MeterReadingForm
          meterId="M-10234"
          meterAddress="123 Main St, Demo City"
          previousReading={32450}
          onSubmit={(reading, photoUrl, gps) => {
            console.log('Reading submitted:', { reading, photoUrl, gps });
            setShowReadingForm(false);
          }}
          onCancel={() => setShowReadingForm(false)}
        />
      )}
    </div>
  );
}
