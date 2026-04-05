import { useState } from 'react';
import { Camera, MapPin, AlertTriangle, CheckCircle, TrendingUp, Navigation } from 'lucide-react';

interface MeterReadingFormProps {
  meterId: string;
  meterAddress: string;
  previousReading: number;
  onSubmit: (reading: number, photoUrl: string, gps: { lat: number; lng: number }) => void;
  onCancel: () => void;
}

export function MeterReadingForm({
  meterId,
  meterAddress,
  previousReading,
  onSubmit,
  onCancel
}: MeterReadingFormProps) {
  const [reading, setReading] = useState('');
  const [photoCapture, setPhotoCapture] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  const readingValue = parseFloat(reading);
  const isValid = !isNaN(readingValue) && readingValue > 0;
  const percentageChange = isValid
    ? ((readingValue - previousReading) / previousReading) * 100
    : 0;

  const hasRecheck = Math.abs(percentageChange) > 40;

  const captureGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGpsAccuracy(position.coords.accuracy);
        },
        (error) => {
          console.error('GPS error:', error);
          // Use mock coordinates for demo
          setGpsCoordinates({
            lat: 40.7128 + (Math.random() - 0.5) * 0.01,
            lng: -74.0060 + (Math.random() - 0.5) * 0.01
          });
          setGpsAccuracy(8);
        }
      );
    }
  };

  const handleSubmit = () => {
    if (isValid && gpsCoordinates) {
      onSubmit(readingValue, 'mock-photo-url', gpsCoordinates);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Record Meter Reading</h3>
          <div className="text-sm text-gray-600 mt-1">{meterId}</div>
        </div>

        <div className="p-4 space-y-4">
          {/* Address */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} />
            <span>{meterAddress}</span>
          </div>

          {/* GPS Capture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GPS Location
            </label>
            {gpsCoordinates ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-900">Location Captured</div>
                    <div className="text-xs text-green-700 mt-1">
                      {gpsCoordinates.lat.toFixed(4)}, {gpsCoordinates.lng.toFixed(4)}
                    </div>
                    {gpsAccuracy && (
                      <div className={`text-xs mt-1 ${
                        gpsAccuracy <= 10 ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        Accuracy: ±{gpsAccuracy.toFixed(1)}m
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={captureGPS}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <Navigation size={20} />
                <span>Capture GPS Location</span>
              </button>
            )}
          </div>

          {/* Reading Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meter Reading
            </label>
            <input
              type="number"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              placeholder="Enter reading value"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <div className="text-sm text-gray-600 mt-1">
              Previous reading: {previousReading.toLocaleString()}
            </div>
          </div>

          {/* Validation Feedback */}
          {isValid && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Change from previous</span>
                <div className={`flex items-center gap-1 font-medium ${
                  hasRecheck ? 'text-orange-600' : 'text-green-600'
                }`}>
                  <TrendingUp size={16} />
                  <span>{percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%</span>
                </div>
              </div>

              {hasRecheck && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={20} className="text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-orange-900">
                        Recheck Required
                      </div>
                      <div className="text-xs text-orange-700 mt-1">
                        This reading is {Math.abs(percentageChange).toFixed(0)}% {percentageChange > 0 ? 'higher' : 'lower'} than the previous reading. Photo verification recommended.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Photo Capture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo {hasRecheck && <span className="text-orange-600">(Recommended)</span>}
            </label>
            <button
              onClick={() => setPhotoCapture(true)}
              className={`w-full p-3 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center gap-2 ${
                hasRecheck
                  ? 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100'
                  : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600'
              }`}
            >
              <Camera size={20} />
              <span>{photoCapture ? 'Photo Captured' : 'Take Photo'}</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || !gpsCoordinates}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Reading
          </button>
        </div>
      </div>
    </div>
  );
}
