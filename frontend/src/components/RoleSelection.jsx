import React, { useState } from 'react';
import axios from 'axios';
import './RoleSelection.css'; 

function RoleSelection({ onRoleSet }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = async (role) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');

      // Call the new protected route
      const res = await axios.put('/api/user/role', 
        { role }, // The body
        { headers: { 'x-auth-token': token } } // The header
      );

      // IMPORTANT: Update localStorage with the NEW token and role
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userRole', res.data.role);

      // Tell the DashboardPage to re-render
      onRoleSet(res.data.role);

    } catch (err) {
      setError('Could not set role. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="role-selection-container">
      <div className="role-selection-box">
        <h1>Welcome to Campus360</h1>
        <p className="quote">"The best way to predict the future is to create it."</p>
        <p>To get started, please select your role:</p>

        <div className="role-buttons">
          <button onClick={() => handleRoleSelect('student')} disabled={loading}>
            I am a Student
          </button>
          <button onClick={() => handleRoleSelect('faculty')} disabled={loading}>
            I am Faculty
          </button>
          <button onClick={() => handleRoleSelect('club')} disabled={loading}>
            I am a Club Member
          </button>
        </div>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default RoleSelection;