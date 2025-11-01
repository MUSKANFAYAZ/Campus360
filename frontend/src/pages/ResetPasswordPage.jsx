// frontend/src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './RegisterPage.css'; // Reusing styles
import PasswordInput from '../components/PasswordInput'; // Your component

function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { token } = useParams();
  const navigate = useNavigate(); // This function is already here

  const handleSubmit = async (e) => {
    // ... (your existing handleSubmit logic is perfect)
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const res = await axios.post(`/api/auth/reset-password/${token}`, { password });
      setMessage(res.data.msg || 'Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'An error occurred.');
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Reset Password</h2>
        
        <PasswordInput
          label="New Password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={true}
        />
        <PasswordInput
          label="Confirm New Password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required={true}
        />
        
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
        
          <button 
            type="submit" 
            className="register-button" 
            style={{backgroundColor: '#007bff'}}
          >
            Update Password
          </button>
           <div className="button-group">
          <button 
            type="button" 
            className="cancel-button" 
            onClick={() => navigate('/login')}
          >
            Cancel
          </button>
        </div>
        
        {message && (
          <div className="login-link">
            <p><Link to="/login">Back to Login</Link></p>
          </div>
        )}
      </form>
    </div>
  );
}

export default ResetPasswordPage;