import React, { useState, useContext } from 'react';
import { LogInContext } from '../../../Context/LogInContext/Login.jsx';
import { chatSession } from '../../../Service/AiModel.jsx';
import toast from 'react-hot-toast';

const Recommendations = () => {
  const { user, isAuthenticated } = useContext(LogInContext);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateRecommendations = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to get recommendations');
      return;
    }
    setLoading(true);
    try {
      const prompt = `Based on the user's trip history, suggest 3 new trip destinations with brief descriptions.`;
      const result = await chatSession.sendMessage(prompt);
      const response = result.response.text();
      setRecommendations(JSON.parse(response));
      toast.success('Recommendations generated');
    } catch (error) {
      toast.error('Error generating recommendations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <div>Please log in to view recommendations.</div>;
  }

  return (
    <div className="recommendations-container max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Trip Recommendations</h1>
      <button
        onClick={generateRecommendations}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-6"
      >
        {loading ? 'Generating...' : 'Get Recommendations'}
      </button>
      <div className="recommendations-list">
        {recommendations.map((rec, index) => (
          <div key={index} className="recommendation-card bg-white p-4 rounded-lg shadow-md mb-4">
            <h2 className="text-xl font-semibold">{rec.destination}</h2>
            <p>{rec.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
