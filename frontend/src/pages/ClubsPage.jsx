// frontend/src/pages/ClubsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../components/DashboardContent.css';
import './ClubsPage.css'; 
import Layout from '../components/Layout'; // Import Layout

function ClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [followedClubs, setFollowedClubs] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [buttonLoading, setButtonLoading] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const authHeader = { headers: { 'x-auth-token': token } };
  const userRole = localStorage.getItem('userRole');

  // Fetch all clubs AND the user's followed clubs
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    if (!token) { navigate('/login'); return; }

    try {
      // --- FIX: Fetch both clubs and user data concurrently ---
      const [clubsRes, userRes] = await Promise.all([
        axios.get('/api/clubs', authHeader),      // 1. Get all clubs
        axios.get('/api/auth/me', authHeader) // 2. Get current user's data
      ]);
      // --- END FIX ---

      setClubs(clubsRes.data || []);
      const followedClubObjects = userRes.data?.followedClubs || [];
      const followedClubIds = followedClubObjects.map(club => club._id);
      setFollowedClubs(new Set(followedClubIds));

    } catch (err) {
      setError('Failed to load club data.');
      console.error("Fetch Clubs Error:", err.response?.data || err);
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [token, navigate]); // Dependencies

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Follow action
  const handleFollow = async (clubId, clubName) => {
    setButtonLoading(clubId);
    try {
      if (!token) throw new Error("Authentication error.");
      const res = await axios.put(`/api/clubs/follow/${clubId}`, {}, authHeader);
      setFollowedClubs(new Set(res.data.followedClubs)); // Update state with new list
    } catch (err) {
      console.error("Follow Error:", err.response?.data || err);
      alert(`Failed to follow ${clubName}.`);
       if (err.response?.status === 401) navigate('/login');
    } finally {
        setButtonLoading(null);
    }
  };

  // Handle Unfollow action
  const handleUnfollow = async (clubId, clubName) => {
    setButtonLoading(clubId);
    try {
      if (!token) throw new Error("Authentication error.");
      const res = await axios.put(`/api/clubs/unfollow/${clubId}`, {}, authHeader);
      setFollowedClubs(new Set(res.data.followedClubs)); // Update state
    } catch (err) {
      console.error("Unfollow Error:", err.response?.data || err);
      alert(`Failed to unfollow ${clubName}.`);
       if (err.response?.status === 401) navigate('/login');
    } finally {
        setButtonLoading(null);
    }
  };

  return (
   <Layout userRole={userRole}>
     <h1 style={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>Club Directory</h1>
     <p style={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.5)', marginBottom: '1.5rem' }}>
       Discover and follow clubs to stay updated.
     </p>

     {isLoading && (
        <div className="widget-card"><p>Loading clubs...</p></div>
     )}
     {error && <div className="widget-card error-card"><p className="error-message">{error}</p></div>}

     {!isLoading && !error && (
       <div className="clubs-list-container">
         {clubs.length === 0 ? (
           <div className="widget-card"><p>No clubs have been registered yet.</p></div>
         ) : (
           clubs.map(club => {
             const isFollowing = followedClubs.has(club._id);
             const isCurrentButtonLoading = buttonLoading === club._id;

             return (
               <div key={club._id} className="widget-card club-card">
                 {club.logoUrl && <img src={club.logoUrl} alt={`${club.name} logo`} className="club-logo" />}
                 <div className="club-info">
                   <h3>{club.name}</h3>
                   <span className="club-category">{club.category}</span>
                   <p>{club.description}</p>
                   {club.facultyCoordinator && (
                    <p className="coordinator">
                       Coordinator: {club.facultyCoordinator.name}
                   </p>
                   )}
                 </div>
                 <div className="club-actions">
                   {isFollowing ? (
                     <button
                       onClick={() => handleUnfollow(club._id, club.name)}
                       className="action-button unfollow-button"
                       disabled={isCurrentButtonLoading}
                     >
                       {isCurrentButtonLoading ? '...' : 'Unfollow'}
                     </button>
                   ) : (
                     <button
                       onClick={() => handleFollow(club._id, club.name)}
                       className="action-button follow-button"
                       disabled={isCurrentButtonLoading}
                     >
                       {isCurrentButtonLoading ? '...' : 'Follow'}
                     </button>
                   )}
                 </div>
               </div>
             );
           })
         )}
       </div>
     )}
   </Layout>
  );
}

export default ClubsPage;