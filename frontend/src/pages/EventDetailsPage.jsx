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

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/clubs/event/${id}`, {
          headers: { 'x-auth-token': token }
        });
        setEvent(res.data);
      } catch (err) {
        setError('Failed to load event details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="error-message">{error}</div></Layout>;
  if (!event) return <Layout><div>Event not found</div></Layout>;


  const formattedDate = new Date(event.date).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="action-button" style={{marginBottom: '1rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
         <FaArrowLeft /> Back
      </button>

      <div className="widget-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '0', overflow: 'hidden' }}>
        
        
        {event.posterUrl && (
          <div style={{ width: '100%', height: '400px', backgroundColor: '#f0f0f0' }}>
            <img 
              src={event.posterUrl} 
              alt={event.title} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
        )}


        <div style={{ padding: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#333' }}>{event.title}</h1>
          <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            Organized by <strong>{event.club?.name || 'Club'}</strong>
          </p>

          <div className="notice-meta" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
             <span className="meta-item" style={{ fontSize: '1.1rem' }}>
                <FaCalendarAlt className="meta-icon" /> {formattedDate}
             </span>
             {event.location && (
                <span className="meta-item" style={{ fontSize: '1.1rem' }}>
                    <FaMapMarkerAlt className="meta-icon" /> {event.location}
                </span>
             )}
             <span className="meta-item">
                <FaUser className="meta-icon" /> Posted by {event.author?.name}
             </span>
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