import React, { useState, useContext, useEffect } from 'react';
import { LogInContext } from '../../../Context/LogInContext/Login.jsx';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../Service/Firebase.jsx';

const Analytics = () => {
  const { user, isAuthenticated } = useContext(LogInContext);
  const [analytics, setAnalytics] = useState({
    totalTrips: 0,
    totalPlaces: 0,
    totalHotels: 0,
    averageRating: 0
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      try {
        const tripsQuery = query(collection(db, 'trips'), where('userId', '==', user.uid));
        const tripsSnapshot = await getDocs(tripsQuery);
        const trips = tripsSnapshot.docs.map(doc => doc.data());

        const totalTrips = trips.length;
        const totalPlaces = trips.reduce((sum, trip) => sum + (trip.places?.length || 0), 0);
        const totalHotels = trips.reduce((sum, trip) => sum + (trip.hotels?.length || 0), 0);
        const averageRating = trips.reduce((sum, trip) => sum + (trip.rating || 0), 0) / totalTrips || 0;

        setAnalytics({ totalTrips, totalPlaces, totalHotels, averageRating });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (!isAuthenticated) {
    return <div>Please log in to view analytics.</div>;
  }

  return (
    <div className="analytics-container max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Trip Analytics</h1>
      <div className="analytics-grid grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="analytics-card bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Total Trips</h2>
          <p className="text-2xl">{analytics.totalTrips}</p>
        </div>
        <div className="analytics-card bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Total Places</h2>
          <p className="text-2xl">{analytics.totalPlaces}</p>
        </div>
        <div className="analytics-card bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Total Hotels</h2>
          <p className="text-2xl">{analytics.totalHotels}</p>
        </div>
        <div className="analytics-card bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Average Rating</h2>
          <p className="text-2xl">{analytics.averageRating.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
