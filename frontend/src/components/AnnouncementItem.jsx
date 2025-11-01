import React from 'react';
import { BsMegaphoneFill } from 'react-icons/bs'; 
import './NoticeItem.css'; 
import '../pages/NoticesPage.css'; 

// Helper to format the date
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

function AnnouncementItem({ announcement }) {
  const { title, content, author, club, createdAt } = announcement;

  return  (
    <div className="widget-card notice-item club-announcement">
      <h3 className="notice-title">{title}</h3>
      <p className="notice-meta">
        {/* Use the 'club-tag' style for the club name */}
        <span className="notice-category club-tag">
          <BsMegaphoneFill /> {club?.name || 'Club Announcement'}
        </span>
        | Posted by {author?.name || 'N/A'} on {formatDate(createdAt)}
      </p>
      <div className="notice-content">
        {/* Map content to preserve line breaks */}
        {content.split('\n').map((line, index) => (
          <React.Fragment key={index}>{line}<br /></React.Fragment>
        ))}
      </div>
      {/* Delete/Edit buttons are not needed for the general student feed */}
    </div>
  );
}

export default AnnouncementItem;