import React, { useEffect } from 'react';
import { registerServiceWorker, getCachedTripData } from '../../Service/OfflineService.jsx';

const OfflineMode = () => {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  const cachedData = getCachedTripData();

  return (
    <div className="offline-mode bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">Offline Mode</h2>
      <p>Service worker registered for offline capabilities.</p>
      {cachedData && (
        <div className="mt-4">
          <h3>Cached Trip Data:</h3>
          <pre>{JSON.stringify(cachedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default OfflineMode;
