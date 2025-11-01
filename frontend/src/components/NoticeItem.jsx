import React from 'react';
import { BsPinAngleFill, BsPaperclip } from 'react-icons/bs'; 
import { GrAnnounce } from "react-icons/gr";
import './NoticeItem.css'; 

// Function to format dates nicely
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

function NoticeItem({ notice, currentUserRole, currentUserId, onDelete }) {
  const { _id, title, content, author, category, createdAt, isPinned, attachments, expiresAt } = notice;

  const canDelete = currentUserRole === 'admin' || author?._id === currentUserId;
  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  if (isExpired) {
    return null; // Don't render expired notices (backend filters too, but good practice here)
  }

return (
    // Make sure 'widget-card' class is applied for frosted glass
    <div className={`widget-card notice-item ${isPinned ? 'pinned' : ''}`}>
      {isPinned && <BsPinAngleFill className="pin-icon" title="Pinned Notice" />}

      {/* Title is now the main heading */}
      <h3 className="notice-title">{title}</h3>

      {/* Meta information below the title */}
      <p className="notice-meta">
        <span className="notice-category"> <GrAnnounce />{category}</span> | Posted by {author ? author.name : 'Unknown'} ({author ? author.role : 'N/A'}) on {formatDate(createdAt)}
        {expiresAt && <span className="notice-expiry"> | Expires: {formatDate(expiresAt)}</span>}
      </p>

      {/* Content */}
      <div className="notice-content">
        {content.split('\n').map((line, index) => (
          <React.Fragment key={index}>{line}<br /></React.Fragment>
        ))}
      </div>

      {/* Attachments */}
      {attachments && attachments.length > 0 && (
        <div className="notice-attachments">
            {/* ... attachment rendering ... */}
        </div>
      )}

      {/* Delete Button */}
      {canDelete && (
        <button onClick={() => onDelete(_id)} className="delete-notice-btn">
          Delete
        </button>
      )}
    </div>
  );
}

export default NoticeItem;