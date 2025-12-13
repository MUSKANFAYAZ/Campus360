import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import { BsPinAngleFill } from 'react-icons/bs'; 
import { GrAnnounce } from "react-icons/gr";
import './NoticeItem.css'; 

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

function NoticeItem({ notice, currentUserRole, currentUserId, onDelete }) {
  const navigate = useNavigate();
  const { _id, title, content, author, category, createdAt, isPinned, attachments, expiresAt } = notice;

  const canDelete = currentUserRole === 'admin' || author?._id === currentUserId;
  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  const handleCardClick = () => {
    navigate(`/notices/${_id}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(_id);
  };

  if (isExpired) return null;

  return (
    <div 
      className={`widget-card notice-item ${isPinned ? 'pinned' : ''}`}
      onClick={handleCardClick}
      style={{ cursor: 'pointer', position: 'relative' }} // Always pointer
    >
      {isPinned && <BsPinAngleFill className="pin-icon" title="Pinned Notice" />}

      <h3 className="notice-title">{title}</h3>

      <p className="notice-meta">
        <span className="notice-category"> <GrAnnounce />{category}</span> | Posted by {author ? author.name : 'Unknown'} ({author ? author.role : 'N/A'}) on {formatDate(createdAt)}
        {expiresAt && <span className="notice-expiry"> | Expires: {formatDate(expiresAt)}</span>}
      </p>

      <div className="notice-content">
        {(content || "").split('\n').map((line, index) => (
          <React.Fragment key={index}>{line}<br /></React.Fragment>
        ))}
      </div>

      {canDelete && (
        <button onClick={handleDelete} className="delete-notice-btn">
          Delete
        </button>
      )}

      <div style={{ marginTop: '0.8rem', fontSize: '0.9rem', color: '#007bff', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
         Click to view full details →
      </div>
    </div>
  );
}

export default NoticeItem;