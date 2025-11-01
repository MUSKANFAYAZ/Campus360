// frontend/src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './RegisterPage.css'; // We can reuse the register page styles

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      // This calls your backend route
      const res = await axios.post('/api/auth/forgot-password', { email });
      setMessage(res.data.msg || 'If an account exists, a reset link has been sent.');
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>
        <p style={{ color: '#555', textAlign: 'center', marginBottom: '1rem' }}>
          Enter your email and we'll send you a link to reset your password.
        </p>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="register-button" style={{backgroundColor: '#007bff'}}>
          Send Reset Link
        </button>

        <div className="login-link">
          <p><Link to="/login">Back to Login</Link></p>
        </div>
      </form>
    </div>
  );
}

export default ForgotPasswordPage;