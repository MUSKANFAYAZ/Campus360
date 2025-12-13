import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { FaArrowLeft, FaUser } from 'react-icons/fa';
import '../components/DashboardContent.css';

function AnnouncementDetailsPage() {
  const { id } = useParams(); // Get ID from URL
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await axios.get(`/api/feed`, {
          headers: { 'x-auth-token': token }
        });
        
        // Finding the announcement with matching ID
        const items = res.data?.feed || [];
        const announcementItem = items.find(item => item._id === id && item.type === 'announcement');
        
        if (announcementItem) {
          setAnnouncement(announcementItem);
        } else {
          setError('Announcement not found.');
        }
      } catch (err) {
        setError('Failed to load announcement details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id]);

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="error-message">{error}</div></Layout>;
  if (!announcement) return <Layout><div>Announcement not found</div></Layout>;

  const formattedDate = new Date(announcement.createdAt).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="action-button" style={{marginBottom: '1rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
         <FaArrowLeft /> Back
      </button>

      <div className="widget-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#333' }}>{announcement.title}</h1>
        
        <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          From <strong>{announcement.club?.name || 'Club'}</strong>
        </p>

        <div className="notice-meta" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
           <span className="meta-item" style={{ fontSize: '1rem' }}>
              <FaUser className="meta-icon" /> {announcement.author?.name || 'Unknown'}
           </span>
           <span className="meta-item" style={{ fontSize: '1rem' }}>
              Posted on {formattedDate}
           </span>
        </div>

        <div className="notice-content" style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#333' }}>
          {(announcement.content || "").split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              <br/>
            </React.Fragment>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default AnnouncementDetailsPage;
