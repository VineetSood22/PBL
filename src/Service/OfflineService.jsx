// Service for offline capabilities using service workers
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

export const cacheTripData = (tripData) => {
  localStorage.setItem('cachedTrips', JSON.stringify(tripData));
};

export const getCachedTripData = () => {
  const data = localStorage.getItem('cachedTrips');
  return data ? JSON.parse(data) : null;
};
