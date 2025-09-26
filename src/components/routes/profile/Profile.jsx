import React, { useState, useContext } from 'react';
import { LogInContext } from '../../../Context/LogInContext/Login.jsx';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../Service/Firebase.jsx';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, isAuthenticated } = useContext(LogInContext);
  const [profileData, setProfileData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    bio: '',
    preferences: []
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, profileData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Error updating profile');
      console.error(error);
    }
  };

  if (!isAuthenticated) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="profile-container max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      <div className="profile-info bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Name</label>
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={profileData.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          ) : (
            <p>{profileData.name}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Email</label>
          <p>{profileData.email}</p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Bio</label>
          {isEditing ? (
            <textarea
              name="bio"
              value={profileData.bio}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows="4"
            />
          ) : (
            <p>{profileData.bio || 'No bio provided'}</p>
          )}
        </div>
        <div className="flex justify-end">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
