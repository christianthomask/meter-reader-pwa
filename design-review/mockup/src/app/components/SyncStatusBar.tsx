import { useState, useEffect } from 'react';
import { Cloud, CloudOff, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface SyncStatusBarProps {
  pendingReadings?: number;
  lastSync?: Date;
}

export function SyncStatusBar({ pendingReadings = 0, lastSync }: SyncStatusBarProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getSyncStatus = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff size={16} />,
        text: 'Offline Mode',
        color: 'bg-gray-100 text-gray-700'
      };
    }

    if (pendingReadings > 0) {
      return {
        icon: <CloudOff size={16} />,
        text: `${pendingReadings} pending sync`,
        color: 'bg-orange-100 text-orange-700'
      };
    }

    return {
      icon: <CheckCircle size={16} />,
      text: 'All synced',
      color: 'bg-green-100 text-green-700'
    };
  };

  const status = getSyncStatus();

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${status.color}`}>
          {status.icon}
          <span>{status.text}</span>
        </div>

        {lastSync && isOnline && (
          <div className="text-xs text-gray-500">
            Last sync: {lastSync.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
