import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { libraries } from '@/Service/GlobalApi';

const GoogleMapsProvider = ({ children }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
  const mapId = import.meta.env.VITE_GOOGLE_MAP_ID;

  if (!apiKey) {
    console.error('Google Maps API key not found');
    return <div>Error: Google Maps API key not configured</div>;
  }

  // Only include mapId if it's provided (optional for basic functionality)
  const providerProps = {
    apiKey,
    libraries,
    version: "beta"
  };

  if (mapId) {
    providerProps.mapId = mapId;
  }

  return (
    <APIProvider {...providerProps}>
      {children}
    </APIProvider>
  );
};

export default GoogleMapsProvider;
