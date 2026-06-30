import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout'; 
import { FaCalendarAlt, FaMapMarkerAlt, FaUser, FaArrowLeft } from 'react-icons/fa';
import '../components/DashboardContent.css'; 

function EventDetailsPage() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- FIX: Force a user object so the Sidebar always appears ---
  const [currentUser, setCurrentUser] = useState(() => {
    // 1. Try to read from Local Storage
    const savedRole = localStorage.getItem('role');
    const savedName = localStorage.getItem('name');

    // 2. Debug Log (Check your browser console if sidebar is still empty)
    console.log("Restoring User:", { savedRole, savedName });

    // 3. Return a valid user object. 
    // If no role is found, default to 'student' so the sidebar isn't blank.
    return { 
      role: savedRole || 'student', 
      name: savedName || 'User' 
    };
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const config = { headers: { 'x-auth-token': token } };

        // Fetch Event Details
        const res = await axios.get(`/api/clubs/event/${id}`, config);
        setEvent(res.data);

      } catch (err) {
        setError('Failed to load event details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, navigate]);

  // --- PASS 'currentUser' TO ALL LAYOUTS ---
  if (loading) return <Layout user={currentUser}><div style={{padding: '2rem'}}>Loading...</div></Layout>;
  if (error) return <Layout user={currentUser}><div className="error-message" style={{padding: '2rem'}}>{error}</div></Layout>;
  if (!event) return <Layout user={currentUser}><div style={{padding: '2rem'}}>Event not found</div></Layout>;

  const formattedDate = new Date(event.date).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <Layout user={currentUser}>
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="action-button" 
        style={{
            marginBottom: '1rem', 
            width: 'auto', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            cursor: 'pointer'
        }}
      >
         <FaArrowLeft /> Back
      </button>

      <div className="widget-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '0', overflow: 'hidden' }}>
        
        {/* Poster Image */}
        {event.posterUrl && (
          <div style={{ 
            width: '100%', 
            height: 'auto', 
            maxHeight: '500px', 
            backgroundColor: '#f8f9fa', 
            display: 'flex', 
            justifyContent: 'center',
            borderBottom: '1px solid #eee'
          }}>
            <img 
              src={event.posterUrl} 
              alt={event.title} 
              style={{ 
                  width: '100%', 
                  height: '100%',
                  maxHeight: '500px', 
                  objectFit: 'contain'
              }} 
            />
          </div>
        )}

        {/* Content Section */}
        <div style={{ padding: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#333' }}>{event.title}</h1>
          
          <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            Organized by <strong>{event.club?.name || 'Club'}</strong>
          </p>

          <div className="notice-meta" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
             <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <span className="meta-item" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaCalendarAlt className="meta-icon" style={{color: '#007bff'}} /> {formattedDate}
                </span>
                
                {event.location && (
                    <span className="meta-item" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaMapMarkerAlt className="meta-icon" style={{color: '#dc3545'}} /> {event.location}
                    </span>
                )}
             </div>
             
             <div style={{ marginTop: '1rem', fontSize: '1rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaUser className="meta-icon" /> Posted by {event.author?.name || 'Unknown'}
             </div>
          </div>

          <div style={{ lineHeight: '1.8', fontSize: '1.1rem', color: '#444', whiteSpace: 'pre-wrap' }}>
            {event.description}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default EventDetailsPage;