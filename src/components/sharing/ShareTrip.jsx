import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const ShareTrip = ({ tripId }) => {
  const [shareUrl, setShareUrl] = useState('');

  const generateShareUrl = () => {
    const url = `${window.location.origin}/shared-trip/${tripId}`;
    setShareUrl(url);
    navigator.clipboard.writeText(url);
    toast.success('Share URL copied to clipboard');
  };

  return (
    <div className="share-trip-container">
      <button
        onClick={generateShareUrl}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Share Trip
      </button>
      {shareUrl && (
        <div className="mt-2">
          <p>Share URL: {shareUrl}</p>
        </div>
      )}
    </div>
  );
};

export default ShareTrip;
