import React, { useState } from 'react';
import axios from 'axios';
import './SubjectModal.css';

function SubjectModal({ isOpen, onClose, onSubjectAdded }) {
  const [subjectName, setSubjectName] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [error, setError] = useState('');

  const daysOfWeek = [
    { short: 'Sun', index: 0 }, { short: 'Mon', index: 1 }, { short: 'Tue', index: 2 },
    { short: 'Wed', index: 3 }, { short: 'Thu', index: 4 }, { short: 'Fri', index: 5 },
    { short: 'Sat', index: 6 },
  ];

  const handleDayToggle = (dayIndex) => {
    setSelectedDays(prev =>
      prev.includes(dayIndex)
        ? prev.filter(index => index !== dayIndex) 
        : [...prev, dayIndex]                     
    );
  };

 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!subjectName || selectedDays.length === 0) {
      setError('Please enter a subject name and select at least one day.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
     
      const res = await axios.post('/api/attendance/subjects',
        { name: subjectName, days: selectedDays },
        { headers: { 'x-auth-token': token } }
      );
      onSubjectAdded(res.data); 
     
      setSelectedDays([]);
      onClose();
    } catch (err) {
      setError('Failed to add subject. Please try again.');
      console.error("Error adding subject:", err.response?.data || err);
    }
  };

  if (!isOpen) return null;

  
  return (
    <div className="modal-overlay">
      <div className="modal-content widget-card"> 
        <h2>Add New Subject</h2>
        <form onSubmit={handleSubmit}>
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
        
          <div className="form-group">
            <label>Select Days Classes Are Held</label>
            <div className="day-selector">
              {daysOfWeek.map((day) => (
                <button
                  key={day.index} 
                  type="button"
                 
                  className={`day-button ${selectedDays.includes(day.index) ? 'selected' : ''}`}       
                  onClick={() => handleDayToggle(day.index)}
                >
                  {day.short} 
                </button>
              ))}
            </div>
          </div>

          
          {error && <p className="error-message">{error}</p>}

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