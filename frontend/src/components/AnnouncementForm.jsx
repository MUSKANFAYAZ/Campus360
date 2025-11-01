import React, { useState } from 'react';
import axios from 'axios';
import './DashboardContent.css'; 
import './AnnouncementForm.css';

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

    // Prepare data for the backend (using Notice model structure)
    const announcementData = {
      title,
      content,
      category: 'Club Activity',
      audience: 'All',
    };

    try {
      if (!token) throw new Error("Authentication error.");
      const res = await axios.post(`/api/clubs/${clubId}/announcements`, announcementData, authHeader);

      // Call the callback function passed from the parent
      if (onAnnouncementCreated) {
          onAnnouncementCreated(res.data);
      }
      setTitle('');
      setContent('');
      if (onClose) onClose();

    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to post announcement.');
      console.error("Error posting announcement:", err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Use widget-card for consistent styling, or a custom class
    <div className="widget-card announcement-form-card">
      <h2>New Announcement</h2>
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-group">
          <label htmlFor="announcementTitle">Title</label>
          <input
            type="text"
            id="announcementTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Content */}
        <div className="form-group">
          <label htmlFor="announcementContent">Content</label>
          <textarea
            id="announcementContent"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={6} // Adjust rows as needed
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        {/* Actions */}
        <div className="form-actions">
          {/* Optional Cancel button if used in a modal */}
          {onClose && (
            <button type="button" className="cancel-button" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
          )}
          <button type="submit" className="action-button post-button" disabled={isLoading}>
            {isLoading ? 'Posting...' : 'Post Announcement'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AnnouncementForm;