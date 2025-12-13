import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { FaArrowLeft, FaUser } from 'react-icons/fa';
import '../components/DashboardContent.css';

function NoticeDetailsPage() {
  const { id } = useParams(); // Get ID from URL
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const token = localStorage.getItem('token');
        // Fetch from the feed endpoint
        const res = await axios.get(`/api/feed`, {
          headers: { 'x-auth-token': token }
        });
        
        // Find the notice with matching ID
        const items = res.data?.feed || [];
        const noticeItem = items.find(item => item._id === id && item.type === 'notice');
        
        if (noticeItem) {
          setNotice(noticeItem);
        } else {
          setError('Notice not found.');
        }
      } catch (err) {
        setError('Failed to load notice details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
  }, [id]);

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="error-message">{error}</div></Layout>;
  if (!notice) return <Layout><div>Notice not found</div></Layout>;

  const formattedDate = new Date(notice.createdAt).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const expiryDate = notice.expiresAt ? new Date(notice.expiresAt).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : null;

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="action-button" style={{marginBottom: '1rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
         <FaArrowLeft /> Back
      </button>

      <div className="widget-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        {notice.isPinned && (
          <div style={{ 
            backgroundColor: '#ffeaa7', 
            padding: '0.5rem 1rem', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            fontWeight: '600',
            color: '#2d3436'
          }}>
            📌 Pinned Notice
          </div>
        )}

        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#333' }}>{notice.title}</h1>
        
        <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          <strong>{notice.category}</strong>
        </p>

        <div className="notice-meta" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
           <span className="meta-item" style={{ fontSize: '1rem' }}>
              <FaUser className="meta-icon" /> {notice.author?.name || 'Unknown'} ({notice.author?.role || 'N/A'})
           </span>
           <span className="meta-item" style={{ fontSize: '1rem' }}>
              Posted on {formattedDate}
           </span>
           {expiryDate && (
             <span className="meta-item" style={{ fontSize: '1rem', color: '#d63031' }}>
                Expires: {expiryDate}
             </span>
           )}
        </div>

        <div className="notice-content" style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#333' }}>
          {(notice.content || "").split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              <br/>
            </React.Fragment>
          ))}
        </div>

        {notice.attachments && notice.attachments.length > 0 && (
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Attachments</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {notice.attachments.map((attachment, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem' }}>
                  <a 
                    href={attachment.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#007bff', textDecoration: 'none' }}
                  >
                    📎 {attachment.filename}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default NoticeDetailsPage;
