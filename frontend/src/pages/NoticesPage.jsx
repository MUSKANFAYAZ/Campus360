import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import NoticeItem from '../components/NoticeItem';
import Layout from '../components/Layout';
import '../components/DashboardContent.css';
import './NoticesPage.css'; 
import { useNavigate } from 'react-router-dom';
import NoticeModal from '../components/NoticeModal'; 
import { BsMegaphoneFill, BsCalendarEventFill } from 'react-icons/bs';
import { IoMdAddCircle } from "react-icons/io";

function NoticesPage() {
  const [feed, setFeed] = useState([]);
  const [userClubListSet, setUserClubListSet] = useState(new Set());
  
  const [filter, setFilter] = useState('all');
  const [showOnlyMyClubs, setShowOnlyMyClubs] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const role = userRole ? userRole.toLowerCase() : '';
  const currentUserId = localStorage.getItem('userId');
  const authHeader = { headers: { 'x-auth-token': token } };

  const formatAnnounceDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };
  
  const formatEventDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'full', // e.g., Tuesday, October 28, 2025
      timeStyle: 'short' // e.g., 4:30 PM
    });
  };


  // Fetch the combined feed
  const fetchFeed = useCallback(async () => {
    setIsLoading(true); setError('');
    if (!token) { navigate('/login'); return; }
    try {
      const res = await axios.get('/api/feed', authHeader);
      setFeed(res.data.feed || []);
      setUserClubListSet(new Set(res.data.userClubList || []));
    } catch (err) {
      setError('Failed to load feed.');
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Handle deletion
  const handleDelete = async (item) => {
    let deleteUrl;
    if (item.type === 'notice') deleteUrl = `/api/notices/${item._id}`;
    else if (item.type === 'announcement') deleteUrl = `/api/notices/${item._id}`;
    else if (item.type === 'event') deleteUrl = `/api/clubs/${item.club?._id}/events/${item._id}`;
    
    if (!deleteUrl || !window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await axios.delete(deleteUrl, authHeader);
      fetchFeed(); // Refresh the feed
    } catch (err) {
       alert('Failed to delete post.');
    }
  };

  // --- FILTERING LOGIC ---
  const filteredFeed = feed.filter(item => {
    const typeMatch = filter === 'all' || item.type === filter;
    
    let myClubMatch = true;
    if (showOnlyMyClubs) {
        if (item.type === 'notice') { myClubMatch = true; } // Always show official
        else {
            // Check if item's club ID is in the user's list
            myClubMatch = item.club && userClubListSet.has(item.club._id);
        }
    }
    return typeMatch && myClubMatch;
  });

  const handleNoticeCreated = () => {
    fetchFeed();
  };

  const canPost = ['faculty', 'admin', 'club'].includes(role);

  return (
    <Layout userRole={userRole}>
      <h1>Campus Feed</h1>
      
      {canPost && (
         <button
           onClick={() => setIsNoticeModalOpen(true)}
           className="action-button"
           style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}
         >
            <IoMdAddCircle /> Create New Notice
         </button>
      )}

      {/* --- Filter UI (Updated) --- */}
      <div className="widget-card feed-filters">
        <div className="filter-buttons">
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All Posts</button>
          <button onClick={() => setFilter('notice')} className={filter === 'notice' ? 'active' : ''}>Official Notices</button>
          <button onClick={() => setFilter('announcement')} className={filter === 'announcement' ? 'active' : ''}>Club Announcements</button>
          <button onClick={() => setFilter('event')} className={filter === 'event' ? 'active' : ''}>Club Events</button>
        </div>

        <div className="filter-toggle">
          {/* Only show the toggle if NOT on "Official Notices" tab */}
          {filter !== 'notice' && (
            <>
              <input
                type="checkbox"
                id="myClubsToggle"
                checked={showOnlyMyClubs}
                onChange={(e) => setShowOnlyMyClubs(e.target.checked)}
              />
              {/* Show different text based on role */}
              {role === 'student' && (
                <label htmlFor="myClubsToggle">Show only my followed clubs</label>
              )}
              {role === 'faculty' && (
                <label htmlFor="myClubsToggle">Show only my coordinated clubs</label>
              )}
              {role === 'club' && (
                <label htmlFor="myClubsToggle">Show only my club's posts</label>
              )}
            </>
          )}
        </div>
      </div>
      {/* --- End Filter UI --- */}

      {isLoading && <div className="widget-card"><p>Loading feed...</p></div>}
      {error && <p className="error-message">{error}</p>}

      {!isLoading && !error && (
        <div className="feed-list">
          {filteredFeed.length === 0 ? (
            <div className="widget-card"><p>No posts match your filters.</p></div>
          ) : (
            // --- THIS IS THE MAIN FIX ---
            // We render the JSX directly inside the map
            filteredFeed.map(item => {
              
              // --- Case 1: Official Notice (Uses imported component) ---
              if (item.type === 'notice') {
                return <NoticeItem key={`notice-${item._id}`} notice={item} currentUserRole={userRole} currentUserId={currentUserId} onDelete={() => handleDelete(item)} />;
              }
              
              // --- Case 2: Club Announcement (JSX is inline) ---
              if (item.type === 'announcement') {
                return (
                  <div key={`announcement-${item._id}`} className="widget-card notice-item club-announcement">
                    <h3 className="notice-title">{item.title}</h3>
                    <p className="notice-meta">
                      <span className="notice-category club-tag">
                        <BsMegaphoneFill /> {item.club?.name || 'Club'}
                      </span>
                      | Posted by {item.author?.name || 'N/A'} on {formatAnnounceDate(item.createdAt)}
                    </p>
                    <div className="notice-content">
                      {item.content.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
                    </div>
                  </div>
                );
              }

              // --- Case 3: Club Event (JSX is inline) ---
              if (item.type === 'event') {
                return (
                  <div key={`event-${item._id}`} className="widget-card notice-item club-event">
                    <h3 className="notice-title">{item.title}</h3>
                    <p className="notice-meta event-meta">
                      <span className="notice-category club-tag">
                        <BsCalendarEventFill /> {item.club?.name || 'Club'}
                      </span>
                      | 🗓️ {formatEventDate(item.date)}
                      {item.location && ` | 📍 ${item.location}`}
                    </p>
                    <div className="notice-content">
                      {item.description.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
                    </div>
                  </div>
                );
              }
              
              return null;
            })
          )}
        </div>
      )}

      <NoticeModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        onNoticeCreated={handleNoticeCreated}
      />
    </Layout>
  );
}

export default NoticesPage;