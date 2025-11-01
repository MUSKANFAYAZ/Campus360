import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./DashboardContent.css";
import AnnouncementForm from "./AnnouncementForm";
import EventForm from "./EventForm";

function ClubDashboard({ userName, clubDetails: initialClubDetails }) {
  const navigate = useNavigate();
  const [clubDetails, setClubDetails] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const token = localStorage.getItem("token");
  const authHeader = { headers: { "x-auth-token": token } };

  // --- Fetch Club Data (Club Details, Announcements, Events, Followers) ---
  const fetchClubData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    if (!token) {
      console.error("No token found. Redirecting to login.");
      navigate("/login");
      return;
    }
    try {
      // 1. Fetch the club managed by this user
      const clubRes = await axios.get("/api/clubs/myclub", authHeader);

      if (clubRes.data && clubRes.data.clubDetails) {
        const fetchedClub = clubRes.data.clubDetails;
        const clubId = fetchedClub._id;

        if (!clubId) {
          throw new Error("Fetched club data did not contain a valid ID.");
        }
        setClubDetails(fetchedClub);
        setAnnouncements(clubRes.data.recentAnnouncements || []);
        setEvents(clubRes.data.upcomingEvents || []);
        setFollowers(clubRes.data.followers || []);
      } else {
        // This case redirects to ClubCreationForm via DashboardPage logic
        setError("No club profile found. Please create one.");
        setClubDetails(null);
      }
    } catch (err) {
      setError("Failed to load club dashboard data.");
      console.error(
        "Fetch Club Dashboard Data Error:",
        err.response?.data?.msg || err.message
      );
      if (err.response?.status === 401) {
        console.error("Authentication error (401).");
        localStorage.clear(); // Clear local storage on auth error
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchClubData();
  }, [fetchClubData]);

  // --- Navigation/Modal Handlers ---
  const handleEditProfileClick = () => {
    if (clubDetails?._id) {
      navigate(`/edit-club-profile/${clubDetails._id}`); // Navigate to edit page
    } else {
      console.error("Club ID missing.");
    }
  };

  const openNewAnnouncementModal = () => {
    setIsAnnouncementModalOpen(true);
  };

  const openNewEventModal = () => {
    setIsEventModalOpen(true);
  };

  const handleEventCreated = (newEvent) => {
    fetchClubData(); // Refetch all data to get updated events list
    setIsEventModalOpen(false); // Close the modal
  };

  // --- Render Logic ---
  if (isLoading) return <p style = {{color:"white"}}>Loading club dashboard...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!clubDetails) return <p>Could not load club details.</p>;

  // Sort events by date (assuming 'date' field exists and is sortable)
  const upcomingEvents = events
    .filter((evt) => new Date(evt.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  // Sort announcements by creation date (newest first)
  const recentAnnouncements = announcements
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <>
      <h1>Welcome, {clubDetails.name}</h1>
      <p
        style={{
          color: "white",
          textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
          marginBottom: "1.5rem",
        }}
      >
        Manage your club's activities and engagement.
      </p>

      <div className="widget-grid">
        {/* Club Profile Card */}
        <div className="widget-card">
          <h3>Club Profile</h3>
          <p>
            <strong>Name:</strong> {clubDetails.name}
          </p>
          <p>
            <strong>Category:</strong> {clubDetails.category}
          </p>
          <p>{clubDetails.description}</p>
          <button onClick={handleEditProfileClick} className="action-button">
            Edit Profile
          </button>
        </div>

        {/* Announcements Card */}
        <div className="widget-card">
          <h3>Recent Announcements</h3>
          {recentAnnouncements.length > 0 ? (
            <ul className="dashboard-list">
              {recentAnnouncements.map((ann) => (
                <li key={ann._id}>{ann.title}</li>
              ))}
            </ul>
          ) : (
            <p>No recent announcements.</p>
          )}
          <button onClick={openNewAnnouncementModal} className="action-button">
            New Announcement
          </button>
          {/* Add "View All" link later */}
        </div>

        {/* Events Card */}
        <div className="widget-card">
          <h3>Upcoming Events</h3>
          {upcomingEvents.length > 0 ? (
            <ul className="dashboard-list">
              {upcomingEvents.map((evt) => (
                <li key={evt._id}>
                  {evt.title} - {new Date(evt.date).toLocaleDateString()}
                </li>
              ))}
            </ul>
          ) : (
            <p>No upcoming events scheduled.</p>
          )}
          <button onClick={openNewEventModal} className="action-button">
            New Event
          </button>
          {/* Add "View All" link later */}
        </div>

        {/* Followers Card */}
        <div className="widget-card">
          <h3>
            Followers ({followers.length}
            {followers.length >= 10 ? "+" : ""})
          </h3>
          {followers.length > 0 ? (
            <ul className="dashboard-list follower-list">
              {followers.map((follower) => (
                <li key={follower._id}>{follower.name}</li>
              ))}
            </ul>
          ) : (
            <p>No followers yet.</p>
          )}
          <button onClick={() => navigate('/club-followers')} className="action-button">Manage Followers</button>
        </div>
      </div>

      {isAnnouncementModalOpen && (
        <div className="modal-overlay">
          {" "}
          <AnnouncementForm
            clubId={clubDetails._id} // Pass the club ID
            onClose={() => setIsAnnouncementModalOpen(false)}
            onAnnouncementCreated={(newAnnouncement) => {
              fetchClubData();
              setIsAnnouncementModalOpen(false);
            }}
          />
        </div>
      )}
      {isEventModalOpen && (
        <div className="modal-overlay">
          <EventForm
            clubId={clubDetails._id}
            onClose={() => setIsEventModalOpen(false)}
            onEventCreated={handleEventCreated}
          />
        </div>
      )}
    </>
  );
}

export default ClubDashboard;
