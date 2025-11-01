import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DashboardContent.css'; 
import './NoticeModal.css'; 

function EditProfileModal({ isOpen, onClose, user, onProfileUpdate }) {
  const [name, setName] = useState(user.name);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem('token');
  const authHeader = { headers: { 'x-auth-token': token } };

  // Update state if the user prop changes (though unlikely in a modal)
  useEffect(() => {
    setName(user.name);
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!token) throw new Error("Authentication error.");
      
      const res = await axios.put(
        '/api/user/profile', 
        { name: name },    
        authHeader
      );

      onProfileUpdate(res.data);
      onClose(); 

    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content widget-card">
        <h2>Edit Profile</h2>
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label htmlFor="profileName">Name</label>
            <input
              type="text"
              id="profileName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          {error && <p className="error-message">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="register-button" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;