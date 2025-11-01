import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout";
import EventForm from "../components/EventForm";
import "../components/DashboardContent.css";
import "./ClubEventsPage.css";
import { IoMdAddCircle } from "react-icons/io";
import { useClub } from "../context/ClubContext";

function ClubEventsPage() {
  const { clubData, isLoading, error, refetchClubData } = useClub();

  const [showCreateForm, setShowCreateForm] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const currentUserId = localStorage.getItem("userId");
  const authHeader = { headers: { "x-auth-token": token } };

  // Handler when a new event is created via the form
  const handleEventCreated = () => {
    refetchClubData(); // Tell the context to refresh
    setShowCreateForm(false);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!clubData?.clubDetails?._id) {
      console.error("Cannot delete: Club ID is missing from context.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      if (!token) throw new Error("Authentication error.");
      await axios.delete(
        `/api/clubs/${clubData.clubDetails._id}/events/${eventId}`,
        authHeader
      );
      refetchClubData(); // Tell the context to refresh
      alert("Event deleted successfully.");
    } catch (err) {
      console.error("Delete Event Error:", err.response?.data || err);
      if (err.response?.status === 401) navigate("/login");
      alert(
        "Error deleting event: " + (err.response?.data?.msg || err.message)
      );
    }
  };

  // Format Date for display
  const formatEventDate = (dateString) => {
    if (!dateString) return "Date TBD";
    return new Date(dateString).toLocaleString("en-US", {
      dateStyle: "full", // e.g., Tuesday, October 28, 2025
      timeStyle: "short", // e.g., 4:30 PM
    });
  };

  if (isLoading) {
    return (
      <Layout userRole={userRole}>
        <p>Loading...</p>
      </Layout>
    );
  }

  if (error || !clubData || !clubData.clubDetails) {
    return (
      <Layout userRole={userRole}>
        <h1>Club Events</h1>
        <p className="error-message">
          {error || "No club associated with your account."}
        </p>
      </Layout>
    );
  }

  // Data is loaded and valid
  const { clubDetails, upcomingEvents } = clubData; // Get data from context
  const events = upcomingEvents || [];

 return (
        <Layout userRole={userRole}>
            <h1>{clubDetails.name} - Events</h1>

            {!showCreateForm && (
                <button onClick={() => setShowCreateForm(true)} className="action-button" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <IoMdAddCircle /> Create New Event
                </button>
            )}

            {showCreateForm && (
                <div className="modal-overlay">
                    <EventForm
                        clubId={clubDetails._id}
                        onClose={() => setShowCreateForm(false)}
                        onEventCreated={handleEventCreated}
                    />
                </div>
            )}

            <div className="events-list">
                {events.length === 0 ? (
                    <div className="widget-card"><p>No events scheduled yet.</p></div>
                ) : (
                    events.map(event => {
                        const canDelete = userRole === 'admin' || userRole === 'faculty' || event.author?._id === currentUserId;
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
                                     <button
                                         onClick={() => handleDeleteEvent(event._id)}
                                         className="delete-notice-btn"
                                         title="Delete Event"
                                     >
                                         Delete
                                     </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </Layout>
    );
}

export default ClubEventsPage;