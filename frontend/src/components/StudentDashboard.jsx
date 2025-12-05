import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; 
import './DashboardContent.css';

function StudentDashboard({ userName }) {
  const [subjects, setSubjects] = useState([]);
  const [followedClubs, setFollowedClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentFeedItems, setRecentFeedItems] = useState([]);
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
      // Fetch subjects, user profile, and feed at the same time
      const [subjectsRes, userRes, feedRes] = await Promise.all([
        axios.get('/api/attendance/subjects', authHeader),
        axios.get('/api/auth/me', authHeader) ,// This fetches user data (including followed clubs)
        axios.get('/api/feed', authHeader)
      ]);

      setSubjects(subjectsRes.data || []);
      setRecentFeedItems((feedRes.data?.feed || []).slice(0, 3));
      
      // --- THIS IS THE FIX FOR CLUB NAMES ---
      // It saves the populated list of clubs (with names) to state
      setFollowedClubs(userRes.data?.followedClubs || []); 

    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard data.");
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // This function returns the array of today's classes
  const getTodaysClasses = () => {
    if (subjects.length === 0) return [];
    const todayIndex = new Date().getDay();
    return subjects.filter(subject =>
      subject.days && subject.days.includes(todayIndex)
    );
  };

  const renderFeedTag = (item) => {
    switch(item.type) {
      case 'notice':
        return <span className="feed-tag notice-tag">Notice</span>;
      case 'announcement':
        return <span className="feed-tag announcement-tag">{item.club?.name || 'Club'}</span>;
      case 'event':
        return <span className="feed-tag event-tag">Event</span>;
      default:
        return null;
    }
  };

  const todaysClasses = getTodaysClasses();

  return (
    <> 
      <h1>Welcome, {userName}!</h1>
      <p style={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.5)', marginBottom: '1.5rem' }}>
        Here's a quick summary of your day.
      </p>
      
      {error && <p className="error-message">{error}</p>} 
      
      <div className="widget-grid">
        <div className="widget-card">
          <h3>Today's Classes</h3>
          {isLoading ? (
            <p>Loading schedule...</p>
          ) : todaysClasses.length > 0 ? (
            <>
              <p>You have <strong>{todaysClasses.length}</strong> class(es) scheduled for today:</p>
              <ul className="dashboard-list today-classes-list">
                {todaysClasses.map(subject => (
                  <li key={subject._id}>{subject.name}</li>
                ))}
              </ul>
            </>
          ) : (
            <p>You have no classes scheduled for today.</p>
          )}
          <div className="card-actions">
            <Link to="/attendance" className="card-link">Go to Attendance</Link>
          </div>
        </div>
        
        <div className="widget-card">
          <h3>Recent Notices</h3>
          {isLoading ? (
            <p>Loading notices...</p>
          ) : recentFeedItems.length > 0 ? (
            <ul className="dashboard-list feed-list">
              {/* --- KEY PROP FIX --- */}
              {recentFeedItems.map(item => (
                <li key={item._id}>
                  {renderFeedTag(item)}
                  <span>{item.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent notices found.</p>
          )}
          <div className="card-actions">
            <Link to="/notices" className="card-link">View All Notices</Link>
         </div>
        </div>
        
        <div className="widget-card">
          <h3>My Clubs</h3>
          {isLoading ? (
            <p>Loading clubs...</p>
          ) : followedClubs.length > 0 ? (
            <>
              <p>You are following <strong>{followedClubs.length}</strong> club(s):</p>
              <ul className="dashboard-list followed-clubs-list">
                {followedClubs.slice(0, 3).map(club => ( 
                  <li key={club._id}>{club.name}</li>
                ))}
              </ul>
            </>
          ) : (
            <p>You are not following any clubs yet.</p>
          )}
          <div className="card-actions">
            <Link to="/clubs" className="card-link">Go to Club Portal</Link> 
          </div>
        </div>

      </div>
    </>
  );
}

export default StudentDashboard;