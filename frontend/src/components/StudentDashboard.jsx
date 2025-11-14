// frontend/src/components/StudentDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; 
import './DashboardContent.css';
import './DashboardContent.css'; // Make sure this file exists

function StudentDashboard({ userName }) {
  const [subjects, setSubjects] = useState([]);
  const [followedClubsCount, setFollowedClubsCount] = useState(0); 
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
        axios.get('/api/auth/me', authHeader) ,// Fetches user data
        axios.get('/api/feed', authHeader)
      ]);

      setSubjects(subjectsRes.data || []);
      setRecentFeedItems((feedRes.data?.feed || []).slice(0, 3));
      setFollowedClubsCount(userRes.data?.followedClubs?.length || 0);

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

  // This function is correct
  const getTodaysClassCount = () => {
    if (subjects.length === 0) {
      return []; // Return an empty array
    }
    const todayIndex = new Date().getDay();
    const todaysClasses = subjects.filter(subject =>
      subject.days && subject.days.includes(todayIndex)
    );
    return todaysClasses; // Return the full array
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

  // --- FIX: Call the function and store the result ---
  const todaysClasses = getTodaysClassCount();
  // --- END FIX ---

  return (
    <> 
      <h1>Welcome, {userName}!</h1>
      <p style={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.5)', marginBottom: '1.5rem' }}>
        Here's a quick summary of your day.
      </p>
      
      {error && <p className="error-message">{error}</p>} 
      
      <div className="widget-grid">
        {/* Attendance Card */}
       <div className="widget-card">
         <h3>Today's Classes</h3>
         {isLoading ? (
           <p>Loading schedule...</p>
         ) : todaysClasses.length > 0 ? ( 
           <ul className="dashboard-list today-classes-list">
             {todaysClasses.map(subject => ( // This line will now work
               <li key={subject._id}>{subject.name}</li>
             ))}
           </ul>
         ) : (
           // If no classes
           <p>You have no classes scheduled for today.</p>
         )}
         <div className="card-actions"> {/* Added for good layout */}
           <Link to="/attendance" className="card-link">Go to Attendance</Link>
         </div>
       </div>
        
        {/* Recent Notices Card */}
       <div className="widget-card">
         <h3>Recent Updates</h3>
         {isLoading ? (
           <p>Loading updates...</p>
         ) : recentFeedItems.length > 0 ? (
           <ul className="dashboard-list feed-list">
             {recentFeedItems.map(item => (
               <li key={item._id}>
                 {renderFeedTag(item)}
                 <span>{item.title}</span>
               </li>
             ))}
           </ul>
         ) : (
           <p>No recent updates found.</p>
         )}
         <div className="card-actions"> {/* Added for good layout */}
            <Link to="/notices" className="card-link">View All</Link>
         </div>
       </div>
        
        {/* My Clubs Card */}
        <div className="widget-card">
          <h3>My Clubs</h3>
          {isLoading ? (
            <p>Loading clubs...</p>
          ) : (
            <p>
              You are following <strong>{followedClubsCount}</strong> club(s).
            </p>
          )}
          <div className="card-actions"> {/* Added for good layout */}
            <Link to="/clubs" className="card-link">Go to Club Portal</Link> 
          </div>
        </div>
      </div>
    </>
  );
}

export default StudentDashboard;