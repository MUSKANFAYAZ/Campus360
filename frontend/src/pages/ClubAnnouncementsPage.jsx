import React, { useState} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import AnnouncementForm from "../components/AnnouncementForm";
import NoticeItem from "../components/NoticeItem";
import "../components/DashboardContent.css";
import { IoMdAddCircle } from "react-icons/io";
import { useClub } from '../context/ClubContext';

function ClubAnnouncementsPage() {
  const { clubData, isLoading, error, refetchClubData } = useClub();
  const [showCreateForm, setShowCreateForm] = useState(false);
    
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole'); 
    const currentUserId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const authHeader = { headers: { 'x-auth-token': token } };

  // Handler when a new announcement is created via the form
 const handleAnnouncementCreated = () => {
        refetchClubData(); // Tell the context to refresh
        setShowCreateForm(false);
    };

  // Handler for deleting announcements (passed to NoticeItem)
  const handleDeleteAnnouncement = async (announcementId) => {
        if (!window.confirm("Delete this announcement?")) return;
        try {
           if (!token) throw new Error("Authentication error.");
           await axios.delete(`/api/notices/${announcementId}`, authHeader);
           refetchClubData(); // Tell the context to refresh
           alert("Announcement deleted.");
        } catch (err) {
           alert('Error deleting announcement.');
        }
    };

 return (
        <Layout userRole={userRole}>
            <h1>{clubData?.clubDetails ? `${clubData.clubDetails.name} - Announcements` : 'Club Announcements'}</h1>

            {isLoading && <p>Loading...</p>}
            {error && <p className="error-message">{error}</p>}

            {!isLoading && !error && clubData && (
                <>
                    {!showCreateForm && (
                        <button onClick={() => setShowCreateForm(true)} className="action-button" style={{ marginBottom: '1.5rem' }}>
                            <IoMdAddCircle /> Create New Announcement
                        </button>
                    )}
                    {showCreateForm && (
                        <AnnouncementForm
                            clubId={clubData.clubDetails._id}
                            onClose={() => setShowCreateForm(false)}
                            onAnnouncementCreated={handleAnnouncementCreated}
                        />
                    )}
                    <div className="announcements-list">
                        {clubData.recentAnnouncements.length === 0 ? (
                            <div className="widget-card"><p>No announcements posted yet.</p></div>
                        ) : (
                            // Use the full list from the context
                            clubData.recentAnnouncements.map(announcement => (
                                <NoticeItem
                                    key={announcement._id}
                                    notice={announcement}
                                    currentUserRole={userRole}
                                    currentUserId={currentUserId}
                                    onDelete={handleDeleteAnnouncement}
                                />
                            ))
                        )}
                    </div>
                </>
            )}
        </Layout>
    );
}

export default ClubAnnouncementsPage;