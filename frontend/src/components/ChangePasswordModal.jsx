import React, { useState } from 'react';
import axios from 'axios';
import './DashboardContent.css';
import './NoticeModal.css'; 
import PasswordInput from './PasswordInput'; // Import your reusable component

function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem('token');
  const authHeader = { headers: { 'x-auth-token': token } };

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // 1. Frontend validation
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }

    try {
      if (!token) throw new Error("Authentication error.");
      
      const res = await axios.put(
        '/api/user/change-password', // The new backend route
        { currentPassword, newPassword },
        authHeader
      );

      setSuccess(res.data.msg || 'Password updated successfully!');
      // Reset form after a short delay
      setTimeout(() => {
        resetForm();
        onClose(); // Close the modal
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content widget-card">
        <h2>Change Password</h2>
        <form onSubmit={handleSubmit}>
          
          <PasswordInput
            label="Current Password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required={true}
          />
          
          <PasswordInput
            label="New Password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required={true}
          />
          
          <PasswordInput
            label="Confirm New Password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required={true}
          />
          
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message" style={{color: 'green'}}>{success}</p>}

          <div className="modal-actions">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={() => { resetForm(); onClose(); }} 
              disabled={isLoading}
            >
              Cancel
            </button>
            <button type="submit" className="register-button" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;