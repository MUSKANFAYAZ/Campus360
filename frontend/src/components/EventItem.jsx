import React from 'react';
import { BsCalendarEventFill } from 'react-icons/bs'; 
import './NoticeItem.css'; 
import '../pages/NoticesPage.css'; 

// Helper to format the event date and time
const formatEventDate = (dateString) => {
  if (!dateString) return 'Date TBD';
  return new Date(dateString).toLocaleString('en-US', {
    dateStyle: 'full', // e.g., Tuesday, October 28, 2025
    timeStyle: 'short' // e.g., 4:30 PM
  });
};

function EventItem({ event }) {
  const { title, description, club, date, location } = event;

  return (
    <div className="widget-card notice-item club-event">
      <h3 className="notice-title">{title}</h3>
      <p className="notice-meta event-meta"> {/* Added 'event-meta' for specific styling */}
        {/* Use the 'club-tag' style for the club name */}
        <span className="notice-category club-tag">
          <BsCalendarEventFill /> {club?.name || 'Club Event'}
        </span>
        | 🗓️ {formatEventDate(date)}
        {location && ` | 📍 ${location}`}
      </p>
      <div className="notice-content">
        {description.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
      </div>
    </div>
  );
}

export default EventItem;