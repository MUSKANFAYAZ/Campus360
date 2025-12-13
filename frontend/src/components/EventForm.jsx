import React, { useState } from 'react';
import axios from 'axios';
import './DashboardContent.css';
import './AnnouncementForm.css';

function EventForm({ clubId, onEventCreated, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [poster, setPoster] = useState(null); 
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem('token');
  const authHeader = { headers: { 'x-auth-token': token } };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!title || !description || !date) {
      setError('Title, description, and date are required.');
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('date', date);
      formData.append('location', location);
      if (poster) {
        formData.append('poster', poster); 
      }

      const res = await axios.post(`/api/clubs/${clubId}/events`, formData, authHeader);
      
      if (onEventCreated) onEventCreated(res.data);
      if (onClose) onClose();

    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create event.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="widget-card announcement-form-card">
      
      <h2>Create New Event</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="eventTitle">Event Title</label>
          <input type="text" id="eventTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="eventDescription">Description</label>
          <textarea id="eventDescription" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} />
        </div>

        <div className="form-group">
          <label htmlFor="eventPoster">Event Poster (Image)</label>
          <input 
            type="file" 
            id="eventPoster" 
            accept="image/*" 
            onChange={(e) => setPoster(e.target.files[0])} 
          />
        </div>

        <div className="form-group">
          <label htmlFor="eventDate">Date and Time</label>
          <input type="datetime-local" id="eventDate" value={date} onChange={(e) => setDate(e.target.value)} min={getCurrentDateTime()} required />
        </div>

        <div className="form-group">
          <label htmlFor="eventLocation">Location (Optional)</label>
          <input type="text" id="eventLocation" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Seminar Hall 1" />
        </div>


        {error && <p className="error-message">{error}</p>}

        <div className="form-actions">
          {onClose && <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>}
          <button type="submit" className="action-button post-button" disabled={isLoading}>
            {isLoading ? 'Uploading...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EventForm;