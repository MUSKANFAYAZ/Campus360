import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; 
import './DashboardContent.css';

function StudentDashboard({ userName }) {
  const [subjects, setSubjects] = useState([]);
  const [followedClubsCount, setFollowedClubsCount] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); 

  const token = localStorage.getItem('token');
  const authHeader = { headers: { 'x-auth-token': token } };

  // Fetch all dashboard data concurrently
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      // Fetch subjects and user profile at the same time
      const [subjectsRes, userRes] = await Promise.all([
        axios.get('/api/attendance/subjects', authHeader),
        axios.get('/api/auth/me', authHeader) // Fetches user data
      ]);

      setSubjects(subjectsRes.data || []);
      
      // Set the followed clubs count from the user's profile data
      setFollowedClubsCount(userRes.data?.followedClubs?.length || 0);

    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard data.");
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [token, navigate]); // Add navigate to dependency array

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Run fetch on component mount

  // Calculate today's class count
  const getTodaysClassCount = () => {
    if (subjects.length === 0) {
      return 0; // Return 0 if no subjects
    }
    const todayIndex = new Date().getDay(); // 0 for Sunday, 1 for Monday, etc.
    const todaysClasses = subjects.filter(subject =>
      subject.days && subject.days.includes(todayIndex)
    );
    return todaysClasses.length;
  };


  return (
    // dashboard-content class is applied by the Layout component
    <> 
      <h1>Welcome, {userName}!</h1>
      <p style={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.5)', marginBottom: '1.5rem' }}>
        Here's a quick summary of your day.
      </p>
      
      {error && <p className="error-message">{error}</p>} 
      
      <div className="widget-grid">
        {/* Attendance Card */}
        <div className="widget-card">
          <h3>Attendance</h3>
          {isLoading ? (
            <p>Loading schedule...</p>
          ) : (
            <p>
              {/* Call the function here to get the count */}
              You have <strong>{getTodaysClassCount()}</strong> class(es) scheduled for today.
            </p>
          )}
          <Link to="/attendance">View Details</Link>
        </div>
        
        {/* Recent Notices Card */}
        <div className="widget-card">
          <h3>Recent Notices</h3>
          {/* This is still hardcoded, can be made dynamic later */}
          <ul>
            <li>Mid-term exams schedule posted.</li>
            <li>Hackathon '25 registrations open.</li>
          </ul>
          <Link to="/notices">View All</Link>
        </div>
        
        
        <div className="widget-card">
          <h3>My Clubs</h3>
          {isLoading ? (
            <p>Loading clubs...</p>
          ) : (
            <p>
              You are following <strong>{followedClubsCount}</strong> club(s).
            </p>
          )}
          <Link to="/clubs">Go to Club Portal</Link> 
        </div>
      </div>
    </>
  );
}

export default StudentDashboard;