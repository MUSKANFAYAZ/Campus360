import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import NoticeItem from '../components/NoticeItem'; 
import EventItem from '../components/EventItem';  
import AnnouncementItem from '../components/AnnouncementItem'; 
import Layout from '../components/Layout';
import '../components/DashboardContent.css';
import './NoticesPage.css'; 
import { useNavigate } from 'react-router-dom';

function NoticesPage() {
  const [feed, setFeed] = useState([]);
  const [followedClubs, setFollowedClubs] = useState(new Set());
  const [filter, setFilter] = useState('all'); // 'all', 'notices', 'announcements', 'events'
  const [showOnlyFollowed, setShowOnlyFollowed] = useState(false); // Toggle state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const currentUserId = localStorage.getItem('userId');
  const authHeader = { headers: { 'x-auth-token': token } };

  // Fetch the combined feed
  const fetchFeed = useCallback(async () => {
    setIsLoading(true); setError('');
    if (!token) { navigate('/login'); return; }
    try {
      const res = await axios.get('/api/feed', authHeader);
      setFeed(res.data.feed || []);
      setFollowedClubs(new Set(res.data.followedClubs || []));
    } catch (err) {
      setError('Failed to load feed.');
      console.error("Fetch Feed Error:", err.response?.data || err);
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Handle deletion (needs logic to determine which delete route to call)
  const handleDelete = async (item) => {
    let deleteUrl;
    if (item.type === 'notice') {
      deleteUrl = `/api/notices/${item._id}`;
    } else if (item.type === 'announcement') {
      deleteUrl = `/api/notices/${item._id}`; // Assumes announcements use the 'notices' delete route
    } else if (item.type === 'event') {
      deleteUrl = `/api/clubs/${item.club._id}/events/${item._id}`; // Assumes events need clubId
    }
    if (!deleteUrl) return;
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await axios.delete(deleteUrl, authHeader);
      fetchFeed(); // Refresh the whole feed
    } catch (err) {
       alert('Failed to delete post.');
    }
  };

  // --- "Super Duper" Filtering Logic ---
  const filteredFeed = feed.filter(item => {
    // 1. Filter by type (All, Notices, Announcements, Events)
    const typeMatch = filter === 'all' || item.type === filter;
    
    // 2. Filter by followed clubs (if toggle is on)
    const followedMatch = !showOnlyFollowed || // Show all if toggle is off
                          item.type === 'notice' || // Always show official notices
                          (item.club && followedClubs.has(item.club._id)); // Show if club is followed
                          
    return typeMatch && followedMatch;
  });

  return (
    <Layout userRole={userRole}>
      <h1>Campus Feed</h1>
      
      {/* --- Filter UI --- */}
      <div className="widget-card feed-filters">
        <div className="filter-buttons">
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All Posts</button>
          <button onClick={() => setFilter('notice')} className={filter === 'notice' ? 'active' : ''}>Official Notices</button>
          <button onClick={() => setFilter('announcement')} className={filter === 'announcement' ? 'active' : ''}>Club Announcements</button>
          <button onClick={() => setFilter('event')} className={filter === 'event' ? 'active' : ''}>Club Events</button>
        </div>
        <div className="filter-toggle">
          <input
            type="checkbox"
            id="followedToggle"
            checked={showOnlyFollowed}
            onChange={(e) => setShowOnlyFollowed(e.target.checked)}
          />
          <label htmlFor="followedToggle">Show only my followed clubs</label>
        </div>
      </div>
      {/* --- End Filter UI --- */}

      {isLoading && <p>Loading feed...</p>}
      {error && <p className="error-message">{error}</p>}

      {!isLoading && !error && (
        <div className="feed-list">
          {filteredFeed.length === 0 ? (
            <div className="widget-card"><p>No posts match your filters.</p></div>
          ) : (
            filteredFeed.map(item => {
              // Render a different component based on the item type
              if (item.type === 'notice') {
                return (
                  <NoticeItem
                    key={`notice-${item._id}`}
                    notice={item}
                    currentUserRole={userRole}
                    currentUserId={currentUserId}
                    onDelete={() => handleDelete(item)}
                  />
                );
              }
              if (item.type === 'announcement') {
                return (
                  <AnnouncementItem // Pass 'item' as 'announcement'
                    key={`announcement-${item._id}`}
                    announcement={item}
                  />
                );
              }
              if (item.type === 'event') {
                return (
                  <EventItem // Pass 'item' as 'event'
                    key={`event-${item._id}`}
                    event={item}
                  />
                );
              }
              return null;
            })
          )}
        </div>
      )}
    </Layout>
  );
}

export default NoticesPage;