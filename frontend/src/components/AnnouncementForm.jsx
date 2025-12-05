import React, { useState } from 'react';
import axios from 'axios';
import './DashboardContent.css'; // Import global styles for widget-card
import './AnnouncementForm.css'; // Import specific form styles if you have them

function AnnouncementForm({ clubId, onAnnouncementCreated, onClose }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem('token');
  const authHeader = { headers: { 'x-auth-token': token } };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!title || !content) {
      setError('Title and content are required.');
      setIsLoading(false);
      return;
    }

    if (!clubId) {
      setError('Club ID is missing. Cannot post announcement.');
      setIsLoading(false);
      console.error("Club ID prop is missing in AnnouncementForm");
      return;
    }

    const announcementData = {
      title,
      content,
      category: 'Club Activity',
      audience: 'All',
    };

    try {
      if (!token) throw new Error("Authentication error.");
      
      // Use the correct club-specific route
      const res = await axios.post(`/api/clubs/${clubId}/announcements`, announcementData, authHeader);

      // Call the callback function passed from the parent to refresh data
      if (onAnnouncementCreated) {
        onAnnouncementCreated(res.data);
      }
      
      // Reset form
      setTitle('');
      setContent('');
      
      // Close the modal
      if (onClose) onClose();

    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to post announcement.');
      console.error("Error posting announcement:", err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // We use 'widget-card' to get the white frosted glass background
    // We add 'announcement-form-card' for specific sizing (defined in CSS)
    <div className="widget-card announcement-form-card">
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>New Announcement</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Title Input */}
        <div className="form-group">
          <label htmlFor="announcementTitle">Title</label>
          <input
            type="text"
            id="announcementTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter a catchy title"
          />
        </div>

        {/* Content Textarea */}
        <div className="form-group">
          <label htmlFor="announcementContent">Content</label>
          <textarea
            id="announcementContent"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={6}
            placeholder="Write your announcement details here..."
          />
        </div>

        {/* Error Message */}
        {error && <p className="error-message">{error}</p>}

        {/* Action Buttons */}
        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          {onClose && (
            <button 
              type="button" 
              className="action-button" 
              onClick={onClose} 
              disabled={isLoading}
              style={{ backgroundColor: '#6c757d', width: 'auto' }} // Grey cancel button
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            className="action-button post-button" 
            disabled={isLoading}
            style={{ width: 'auto' }}
          >
            {isLoading ? 'Posting...' : 'Post Announcement'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AnnouncementForm;