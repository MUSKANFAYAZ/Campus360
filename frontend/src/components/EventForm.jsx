import React, { useState } from 'react';
import axios from 'axios';
import './DashboardContent.css'; 
import './AnnouncementForm.css'; 

function EventForm({ clubId, onEventCreated, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(''); // Store as 'YYYY-MM-DDTHH:mm'
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem('token');
  const authHeader = { headers: { 'x-auth-token': token } };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!title || !description || !date) {
      setError('Event title, description, and date/time are required.');
      setIsLoading(false);
      return;
    }
    if (!clubId) {
        setError('Club ID missing.'); setIsLoading(false); return;
    }

    const eventData = { title, description, date, location };

    try {
      if (!token) throw new Error("Auth error.");
      const res = await axios.post(`/api/clubs/${clubId}/events`, eventData, authHeader);
      if (onEventCreated) onEventCreated(res.data);
      // Reset form
      setTitle(''); setDescription(''); setDate(''); setLocation('');
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create event.');
      console.error("Error creating event:", err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get current date/time in format required by datetime-local input
  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Adjust for local timezone
    return now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
  };


  return (
    <div className="widget-card announcement-form-card"> {/* Reuse class */}
      <h2>Create New Event</h2>
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-group">
          <label htmlFor="eventTitle">Event Title</label>
          <input type="text" id="eventTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="eventDescription">Description</label>
          <textarea id="eventDescription" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} />
        </div>

        {/* Date and Time */}
        <div className="form-group">
          <label htmlFor="eventDate">Date and Time</label>
          <input
            type="datetime-local" // Input type for date and time
            id="eventDate"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={getCurrentDateTime()} // Prevent selecting past dates/times
            required
          />
        </div>

        {/* Location (Optional) */}
        <div className="form-group">
          <label htmlFor="eventLocation">Location (Optional)</label>
          <input type="text" id="eventLocation" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Seminar Hall 1" />
        </div>

        {error && <p className="error-message">{error}</p>}

        {/* Actions */}
        <div className="form-actions">
          {onClose && ( <button type="button" className="cancel-button" onClick={onClose} disabled={isLoading}> Cancel </button> )}
          <button type="submit" className="action-button post-button" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EventForm;