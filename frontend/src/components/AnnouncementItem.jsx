import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import { BsMegaphoneFill } from 'react-icons/bs'; 
import './NoticeItem.css'; 
import '../pages/NoticesPage.css'; 

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

function AnnouncementItem({ announcement }) {
  const navigate = useNavigate();
  // Ensure we get the ID
  const { _id, title, content, author, club, createdAt } = announcement;

  const handleCardClick = () => {
    navigate(`/announcements/${_id}`);
  };

  return  (
    <div 
      className="widget-card notice-item club-announcement"
      onClick={handleCardClick} 
      style={{ cursor: 'pointer', position: 'relative' }} 
    >
      <h3 className="notice-title">{title}</h3>
      <p className="notice-meta">
        <span className="notice-category club-tag">
          <BsMegaphoneFill /> {club?.name || 'Club Announcement'}
        </span>
        | Posted by {author?.name || 'N/A'} on {formatDate(createdAt)}
      </p>
      
      <div className="notice-content">
        {(content || "").split('\n').map((line, index) => (
          <React.Fragment key={index}>{line}<br /></React.Fragment>
        ))}
      </div>

      <div style={{ marginTop: '0.8rem', fontSize: '0.9rem', color: '#007bff', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
         Click to view full details →
      </div>
    </div>
  );
}

export default AnnouncementItem;