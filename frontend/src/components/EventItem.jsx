import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import { BsCalendarEventFill } from 'react-icons/bs'; 
import { FaTrash } from 'react-icons/fa'; 
import './NoticeItem.css'; 
import '../pages/NoticesPage.css'; 

const formatEventDate = (dateString) => {
  if (!dateString) return 'Date TBD';
  return new Date(dateString).toLocaleString('en-US', {
    dateStyle: 'full', 
    timeStyle: 'short' 
  });
};

function EventItem({ event, onDelete }) {
  const navigate = useNavigate();
  const { _id, title, description, club, date, location, posterUrl } = event;

  const handleCardClick = () => {
    navigate(`/events/${_id}`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); 
    if (onDelete) onDelete(_id);
  };

  return (
    <div 
      className="widget-card notice-item club-event"
      onClick={handleCardClick} 
      style={{ cursor: 'pointer', position: 'relative' }} 
    >
      {posterUrl && (
        <div className="event-poster-wrapper" style={{marginBottom: '1rem', width: '100%'}}>
            <img 
                src={posterUrl} 
                alt={title} 
                style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px', display: 'block' }} 
            />
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 className="notice-title" style={{ marginTop: 0 }}>{title}</h3>
          
          {onDelete && (
            <button 
                onClick={handleDeleteClick} 
                className="delete-btn"
                style={{ background: 'transparent', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '1rem' }}
                title="Delete Event"
            >
                <FaTrash />
            </button>
          )}
      </div>

      <p className="notice-meta event-meta"> 
        <span className="notice-category club-tag">
          <BsCalendarEventFill /> {club?.name || 'Club Event'}
        </span>
        | 🗓️ {formatEventDate(date)}
        {location && ` | 📍 ${location}`}
      </p>

      <div className="notice-content">
        {(description || "").split('\n').slice(0, 3).map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
        {(description || "").split('\n').length > 3 && <span style={{color: '#007bff'}}>...Read More</span>}
      </div>

     <div style={{ marginTop: '0.8rem', fontSize: '0.9rem', color: '#007bff', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
         Click to view full details →
      </div>
    </div>
  );
}

export default EventItem;