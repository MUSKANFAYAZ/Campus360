import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './RegisterPage.css'; 

function VerifyEmailPage() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the email passed from the registration page
  const email = location.state?.email;

  // If no email was passed, redirect to register
  if (!email) {
    navigate('/register');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/verify-otp', { email, otp });

      setSuccess(res.data.msg);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.msg || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Verify Your Account</h2>
        <p className="auth-subtext">
          An OTP has been sent to <strong>{email}</strong>. Please enter it below.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="otp">6-Digit OTP</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              disabled={loading}
              maxLength={6}
            />
          </div>
          
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <button type="submit" className="auth-button" disabled={loading || success}>
            {loading ? 'Verifying...' : 'Verify & Complete Registration'}
          </button>
        </form>

        <div className="auth-footer">
          Didn't get an email? <Link to="/register">Go back</Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;