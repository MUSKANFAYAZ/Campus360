import React, { useState } from 'react'; 
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import EventForm from '../components/EventForm';
import '../components/DashboardContent.css';
import './ClubEventsPage.css'; 
import { IoMdAddCircle } from 'react-icons/io';
import { useClub } from '../context/ClubContext'; 

function ClubEventsPage() {
    // --- 2. GET data from the global context ---
    const { clubData, isLoading, error, refetchClubData } = useClub();
    
    const [showCreateForm, setShowCreateForm] = useState(false);

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const role = userRole ? userRole.toLowerCase() : '';
    const currentUserId = localStorage.getItem('userId');
    const authHeader = { headers: { 'x-auth-token': token } };

    // --- 3. REMOVED the entire local fetchData and useEffect block ---

    // Handler when a new event is created
    const handleEventCreated = () => {
        refetchClubData(); // Tell the context to refresh
        setShowCreateForm(false);
    };

    // Handler for deleting events
    const handleDeleteEvent = async (eventId) => {
        const clubId = clubData?.clubDetails?._id;
        if (!clubId) return;
        if (!window.confirm("Delete this event?")) return;
         try {
             await axios.delete(`/api/clubs/${clubId}/events/${eventId}`, authHeader);
             refetchClubData(); // Refresh list
             alert("Event deleted successfully.");
         } catch (err) {
             alert('Failed to delete event.');
             console.error("Delete Event Error:", err.response?.data || err);
             if (err.response?.status === 401) navigate('/login');
         }
     };

    const formatEventDate = (dateString) => {
       if (!dateString) return 'Date TBD';
        return new Date(dateString).toLocaleString('en-US', {
            dateStyle: 'full', timeStyle: 'short'
        });
    };

    // --- 4. RENDER based on context state ---
    const clubName = clubData?.clubDetails?.name || 'Club Events';
    const events = clubData?.upcomingEvents || []; // Use data from context

    return (
        <Layout userRole={userRole}>
            <h1>{clubName} - Events</h1>

            {/* Handle Loading/Error from context */}
            {isLoading && <div className="widget-card"><p>Loading...</p></div>}
            {error && <div className="widget-card error-card"><p className="error-message">{error}</p></div>}

            {!isLoading && !error && clubData && (
                <>
                    {/* Create Button (Club reps only) */}
                    {role === 'club' && !showCreateForm && (
                        <button onClick={() => setShowCreateForm(true)} className="action-button" style={{ marginBottom: '1.5rem', width: 'auto' }}>
                            <IoMdAddCircle /> Create New Event
                        </button>
                    )}
                    {showCreateForm && (
                        <div className="modal-overlay">
                            <EventForm
                                clubId={clubData.clubDetails._id}
                                onClose={() => setShowCreateForm(false)}
                                onEventCreated={handleEventCreated}
                            />
                        </div>
                    )}

                    {/* List of Events */}
                    <div className="events-list">
                        {events.length === 0 ? (
                            <div className="widget-card"><p>No events scheduled yet.</p></div>
                        ) : (
                            events.map(event => {
                                const canDelete = role === 'admin' || role === 'faculty' || event.author?._id === currentUserId;
                                return (
                                    <div key={event._id} className="widget-card notice-item event-item">
                                        <h3 className="notice-title">{event.title}</h3>
                                        <p className="notice-meta event-meta">
                                            <span className="notice-category">🗓️ Event</span> | Date: {formatEventDate(event.date)}
                                            {event.location && ` | 📍 Location: ${event.location}`}
                                        </p>
                                        <div className="notice-content event-content">
                                            {event.description.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
                                        </div>
                                        { canDelete && (
                                             <button onClick={() => handleDeleteEvent(event._id)} className="delete-notice-btn">
                                                 Delete
                                             </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}
        </Layout>
    );
}

export default ClubEventsPage;