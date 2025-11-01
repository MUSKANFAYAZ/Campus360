import React, { useState } from 'react';
import axios from 'axios';
import './SubjectModal.css';

function SubjectModal({ isOpen, onClose, onSubjectAdded }) {
  const [subjectName, setSubjectName] = useState('');
  // State holds the selected day *indexes* (0-6)
  const [selectedDays, setSelectedDays] = useState([]);
  const [error, setError] = useState('');

  // Array for rendering the UI buttons
  const daysOfWeek = [
    { short: 'Sun', index: 0 }, { short: 'Mon', index: 1 }, { short: 'Tue', index: 2 },
    { short: 'Wed', index: 3 }, { short: 'Thu', index: 4 }, { short: 'Fri', index: 5 },
    { short: 'Sat', index: 6 },
  ];

  // Toggles the day index in the state array
  const handleDayToggle = (dayIndex) => {
    setSelectedDays(prev =>
      prev.includes(dayIndex)
        ? prev.filter(index => index !== dayIndex) 
        : [...prev, dayIndex]                     
    );
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Validate that a name is entered and at least one day is selected
    if (!subjectName || selectedDays.length === 0) {
      setError('Please enter a subject name and select at least one day.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // Send the subject name and the array of selected day numbers (0-6)
      const res = await axios.post('/api/attendance/subjects',
        { name: subjectName, days: selectedDays },
        { headers: { 'x-auth-token': token } }
      );
      onSubjectAdded(res.data); // Notify parent component
      // Reset form fields and close modal
      setSubjectName('');
      setSelectedDays([]);
      onClose();
    } catch (err) {
      setError('Failed to add subject. Please try again.');
      console.error("Error adding subject:", err.response?.data || err);
    }
  };

  // Don't render the modal if it's not open
  if (!isOpen) return null;

  // Render the modal
  return (
    <div className="modal-overlay">
      <div className="modal-content widget-card"> {/* Reusing card style */}
        <h2>Add New Subject</h2>
        <form onSubmit={handleSubmit}>
          {/* Subject Name Input */}
          <div className="form-group">
            <label htmlFor="subjectName">Subject Name</label>
            <input
               type="text"
               id="subjectName"
               value={subjectName}
               onChange={(e) => setSubjectName(e.target.value)}
               required
            />
          </div>

          {/* Day Selector UI */}
          <div className="form-group">
            <label>Select Days Classes Are Held</label>
            <div className="day-selector">
              {daysOfWeek.map((day) => (
                <button
                  key={day.index} // Use index as key
                  type="button"
                  // Check if the current day's index is in the selectedDays state array
                  className={`day-button ${selectedDays.includes(day.index) ? 'selected' : ''}`}
                  // Call handler with the day's index
                  onClick={() => handleDayToggle(day.index)}
                >
                  {day.short} {/* Display the abbreviation */}
                </button>
              ))}
            </div>
          </div>

          {/* Display error message if any */}
          {error && <p className="error-message">{error}</p>}

          {/* Modal Action Buttons */}
          <div className="modal-actions">
             <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
             <button type="submit" className="register-button">Add Subject</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SubjectModal;