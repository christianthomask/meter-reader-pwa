import { useState } from 'react';
import { Check, X, MapPin, Calendar, User, ZoomIn, AlertTriangle, Navigation, TrendingUp, ChevronLeft } from 'lucide-react';

interface Photo {
  id: string;
  meterId: string;
  address: string;
  reader: string;
  timestamp: string;
  imageUrl: string;
  reading: string;
  status: 'pending' | 'approved' | 'rejected';
  gpsCoordinates?: { lat: number; lng: number };
  gpsAccuracy?: number; // in meters
  recheckFlag?: boolean;
  previousReading?: string;
  recheckReason?: string;
}

interface HistoricalReading {
  month: string;
  reading: number;
  timestamp: string;
}

const mockPhotos: Photo[] = [
  {
    id: '1',
    meterId: 'M-10234',
    address: '123 Main St',
    reader: 'John Smith',
    timestamp: '2026-04-05T09:15:00',
    imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=400&fit=crop',
    reading: '45892',
    status: 'pending',
    gpsCoordinates: { lat: 40.7128, lng: -74.0060 },
    gpsAccuracy: 8,
    recheckFlag: true,
    previousReading: '32450',
    recheckReason: '41% higher than last month'
  },
  {
    id: '2',
    meterId: 'M-10567',
    address: '456 Oak Ave',
    reader: 'Sarah Johnson',
    timestamp: '2026-04-05T10:30:00',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&h=400&fit=crop',
    reading: '32156',
    status: 'pending',
    gpsCoordinates: { lat: 40.7580, lng: -73.9855 },
    gpsAccuracy: 5,
    recheckFlag: false,
    previousReading: '31890'
  },
  {
    id: '3',
    meterId: 'M-10891',
    address: '789 Pine Rd',
    reader: 'Sarah Johnson',
    timestamp: '2026-04-05T11:45:00',
    imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=400&fit=crop',
    reading: '67843',
    status: 'pending',
    gpsCoordinates: { lat: 40.7489, lng: -73.9680 },
    gpsAccuracy: 12,
    recheckFlag: false,
    previousReading: '66234'
  },
  {
    id: '4',
    meterId: 'M-11024',
    address: '321 Elm St',
    reader: 'John Smith',
    timestamp: '2026-04-05T08:20:00',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&h=400&fit=crop',
    reading: '51209',
    status: 'pending',
    gpsCoordinates: { lat: 40.7614, lng: -73.9776 },
    gpsAccuracy: 6,
    recheckFlag: false,
    previousReading: '50123'
  }
];

// Generate mock historical readings for the last 10 months
const generateHistoricalReadings = (meterId: string, currentReading: number): HistoricalReading[] => {
  const readings: HistoricalReading[] = [];
  const now = new Date('2026-04-05');

  // Start with a base reading and work forward
  let baseReading = Math.floor(currentReading * 0.6); // Start at 60% of current

  for (let i = 9; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);

    // Add some variation (increase between 2-8% per month)
    const increase = Math.floor(baseReading * (0.02 + Math.random() * 0.06));
    baseReading += increase;

    readings.push({
      month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      reading: baseReading,
      timestamp: date.toISOString()
    });
  }

  return readings;
};

export function PhotoApproval() {
  const [photos, setPhotos] = useState<Photo[]>(mockPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<HistoricalReading[]>([]);

  const handleApprove = (photoId: string) => {
    setPhotos(prev =>
      prev.map(photo =>
        photo.id === photoId ? { ...photo, status: 'approved' as const } : photo
      )
    );
    setSelectedPhoto(null);
    setShowHistory(false);
  };

  const handleReject = (photoId: string) => {
    setPhotos(prev =>
      prev.map(photo =>
        photo.id === photoId ? { ...photo, status: 'rejected' as const } : photo
      )
    );
    setSelectedPhoto(null);
    setShowHistory(false);
  };

  const handleViewHistory = (photo: Photo) => {
    const history = generateHistoricalReadings(photo.meterId, parseFloat(photo.reading));
    setHistoryData(history);
    setShowHistory(true);
  };

  const filteredPhotos = filter === 'all'
    ? photos
    : photos.filter(photo => photo.status === filter);

  const pendingCount = photos.filter(p => p.status === 'pending').length;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">Photo Approval</h2>
          {pendingCount > 0 && (
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">Review and approve meter readings</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      <div className="space-y-3">
        {filteredPhotos.map(photo => (
          <div
            key={photo.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="relative">
              <img
                src={photo.imageUrl}
                alt={`Meter ${photo.meterId}`}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              />
              <button
                onClick={() => setSelectedPhoto(photo)}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
              >
                <ZoomIn size={18} />
              </button>
              {photo.status !== 'pending' && (
                <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-medium ${
                  photo.status === 'approved'
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {photo.status.charAt(0).toUpperCase() + photo.status.slice(1)}
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">Meter: {photo.meterId}</span>
                <span className="text-lg font-bold text-blue-600">{photo.reading}</span>
              </div>

              {/* Recheck warning */}
              {photo.recheckFlag && photo.recheckReason && (
                <div
                  onClick={() => handleViewHistory(photo)}
                  className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2 cursor-pointer hover:bg-orange-100 transition-colors"
                >
                  <AlertTriangle size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm flex-1">
                    <div className="font-medium text-orange-900">Recheck Required</div>
                    <div className="text-orange-700">{photo.recheckReason}</div>
                    {photo.previousReading && (
                      <div className="text-xs text-orange-600 mt-1">
                        Previous: {photo.previousReading}
                      </div>
                    )}
                    <div className="text-xs text-orange-600 mt-1 underline">
                      Click to view reading history
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{photo.address}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User size={14} />
                  <span>{photo.reader}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{new Date(photo.timestamp).toLocaleString()}</span>
                </div>
                {photo.gpsCoordinates && (
                  <div className="flex items-center gap-1">
                    <Navigation size={14} />
                    <span>GPS: {photo.gpsCoordinates.lat.toFixed(4)}, {photo.gpsCoordinates.lng.toFixed(4)}</span>
                    {photo.gpsAccuracy !== undefined && (
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                        photo.gpsAccuracy <= 10 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        ±{photo.gpsAccuracy}m
                      </span>
                    )}
                  </div>
                )}
              </div>

              {photo.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(photo.id)}
                    className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border border-red-200"
                  >
                    <X size={18} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(photo.id)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredPhotos.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
            <p>No {filter !== 'all' && filter} photos found</p>
          </div>
        )}
      </div>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
            >
              <X size={24} />
            </button>

            <img
              src={selectedPhoto.imageUrl}
              alt={`Meter ${selectedPhoto.meterId}`}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />

            <div className="bg-white rounded-lg mt-4 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-gray-900">Meter: {selectedPhoto.meterId}</div>
                  <div className="text-sm text-gray-600">{selectedPhoto.address}</div>
                </div>
                <div className="text-2xl font-bold text-blue-600">{selectedPhoto.reading}</div>
              </div>

              {/* Recheck warning in modal */}
              {selectedPhoto.recheckFlag && selectedPhoto.recheckReason && (
                <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={20} className="text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-orange-900 mb-1">Recheck Required</div>
                      <div className="text-sm text-orange-700">{selectedPhoto.recheckReason}</div>
                      {selectedPhoto.previousReading && (
                        <div className="text-sm text-orange-600 mt-1">
                          Previous reading: {selectedPhoto.previousReading}
                        </div>
                      )}
                      <button
                        onClick={() => handleViewHistory(selectedPhoto)}
                        className="mt-2 text-sm text-orange-700 underline hover:text-orange-900"
                      >
                        View 10-month reading history
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional metadata */}
              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <div className="text-gray-600">Reader</div>
                  <div className="font-medium text-gray-900">{selectedPhoto.reader}</div>
                </div>
                <div>
                  <div className="text-gray-600">Timestamp</div>
                  <div className="font-medium text-gray-900">
                    {new Date(selectedPhoto.timestamp).toLocaleString()}
                  </div>
                </div>
                {selectedPhoto.gpsCoordinates && (
                  <>
                    <div>
                      <div className="text-gray-600">GPS Location</div>
                      <div className="font-medium text-gray-900">
                        {selectedPhoto.gpsCoordinates.lat.toFixed(4)}, {selectedPhoto.gpsCoordinates.lng.toFixed(4)}
                      </div>
                    </div>
                    {selectedPhoto.gpsAccuracy !== undefined && (
                      <div>
                        <div className="text-gray-600">GPS Accuracy</div>
                        <div className={`font-medium ${
                          selectedPhoto.gpsAccuracy <= 10 ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          ±{selectedPhoto.gpsAccuracy} meters
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {selectedPhoto.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleReject(selectedPhoto.id)}
                    className="flex-1 bg-red-50 text-red-700 py-3 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border border-red-200"
                  >
                    <X size={20} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedPhoto.id)}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={20} />
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Historical Readings View */}
      {showHistory && selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowHistory(false)}
        >
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center gap-3">
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Reading History</h3>
                <div className="text-sm text-gray-600">
                  Meter: {selectedPhoto.meterId} - {selectedPhoto.address}
                </div>
              </div>
            </div>

            <div className="p-4">
              {/* Current Reading Highlight */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Current Reading</span>
                  <span className="text-2xl font-bold text-blue-600">{selectedPhoto.reading}</span>
                </div>
                <div className="text-xs text-blue-700">
                  {new Date(selectedPhoto.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Historical Readings Table */}
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Last 10 Months</h4>
              <div className="space-y-2">
                {historyData.map((record, index) => {
                  const nextReading = index < historyData.length - 1 ? historyData[index + 1].reading : parseFloat(selectedPhoto.reading);
                  const change = nextReading - record.reading;
                  const percentChange = (change / record.reading) * 100;

                  return (
                    <div
                      key={record.month}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{record.month}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(record.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {record.reading.toLocaleString()}
                        </div>
                        {index < historyData.length - 1 && (
                          <div className={`flex items-center gap-1 text-xs ${
                            Math.abs(percentChange) > 40 ? 'text-orange-600' : 'text-gray-600'
                          }`}>
                            <TrendingUp size={12} />
                            <span>+{change.toLocaleString()} ({percentChange.toFixed(1)}%)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              {selectedPhoto.status === 'pending' && (
                <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleReject(selectedPhoto.id)}
                    className="flex-1 bg-red-50 text-red-700 py-3 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border border-red-200"
                  >
                    <X size={20} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedPhoto.id)}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={20} />
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
