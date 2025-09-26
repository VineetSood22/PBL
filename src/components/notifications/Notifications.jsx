import React, { useState, useContext, useEffect } from 'react';
import { LogInContext } from '../../../Context/LogInContext/Login';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../Service/Firebase';
import toast from 'react-hot-toast';

const Notifications = () => {
  const { user, isAuthenticated } = useContext(LogInContext);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;
    const notificationsQuery = query(collection(db, 'notifications'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notificationsData);
    });
    return unsubscribe;
  }, [user]);

  const markAsRead = (id) => {
    // Update notification as read in Firebase
    toast.success('Notification marked as read');
  };

  if (!isAuthenticated) {
    return <div>Please log in to view notifications.</div>;
  }

  return (
    <div className="notifications-container max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <div className="notifications-list">
        {notifications.map((notification) => (
          <div key={notification.id} className="notification-card bg-white p-4 rounded-lg shadow-md mb-2">
            <p>{notification.message}</p>
            <button
              onClick={() => markAsRead(notification.id)}
              className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
            >
              Mark as Read
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
