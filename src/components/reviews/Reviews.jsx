import React, { useState, useContext } from 'react';
import { LogInContext } from '../../../Context/LogInContext/Login.jsx';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../Service/Firebase.jsx';
import toast from 'react-hot-toast';

const Reviews = ({ placeId }) => {
  const { user, isAuthenticated } = useContext(LogInContext);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  const fetchReviews = async () => {
    try {
      const reviewsQuery = query(collection(db, 'reviews'), where('placeId', '==', placeId));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs.map(doc => doc.data());
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const submitReview = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to submit a review');
      return;
    }
    try {
      await addDoc(collection(db, 'reviews'), {
        placeId,
        userId: user.uid,
        rating: newReview.rating,
        comment: newReview.comment,
        timestamp: new Date()
      });
      toast.success('Review submitted');
      setNewReview({ rating: 5, comment: '' });
      fetchReviews();
    } catch (error) {
      toast.error('Error submitting review');
      console.error(error);
    }
  };

  useState(() => {
    fetchReviews();
  }, [placeId]);

  return (
    <div className="reviews-container">
      <h2 className="text-2xl font-bold mb-4">Reviews</h2>
      {isAuthenticated && (
        <div className="new-review mb-4">
          <h3>Submit a Review</h3>
          <div className="mb-2">
            <label>Rating:</label>
            <select
              value={newReview.rating}
              onChange={(e) => setNewReview({ ...newReview, rating: e.target.value })}
              className="ml-2"
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
          <textarea
            value={newReview.comment}
            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
            placeholder="Write your review..."
            className="w-full p-2 border rounded mb-2"
            rows="4"
          />
          <button
            onClick={submitReview}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Submit
          </button>
        </div>
      )}
      <div className="reviews-list">
        {reviews.map((review, index) => (
          <div key={index} className="review-card bg-white p-4 rounded-lg shadow-md mb-2">
            <p>Rating: {review.rating}/5</p>
            <p>{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reviews;
