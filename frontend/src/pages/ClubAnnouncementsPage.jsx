import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout'; 
import AnnouncementForm from '../components/AnnouncementForm'; 
import NoticeItem from '../components/NoticeItem'; 
import '../components/DashboardContent.css'; 
import { IoMdAddCircle } from "react-icons/io";
import { useClub } from '../context/ClubContext'; 

function ClubAnnouncementsPage() {
    // --- 2. GET data from the global context ---
    // 'isLoading' and 'error' now come from the context
    const { clubData, isLoading, error, refetchClubData } = useClub();
    
    const [showCreateForm, setShowCreateForm] = useState(false);
    
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole'); 
    const role = userRole ? userRole.toLowerCase() : '';
    const currentUserId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const authHeader = { headers: { 'x-auth-token': token } };

    // --- 3. REMOVED the entire local fetchData and useEffect block ---

    // Handler when a new announcement is created
    const handleAnnouncementCreated = () => {
        refetchClubData(); // Tell the context to refresh
        setShowCreateForm(false);
    };

    // Handler for deleting
    const handleDeleteAnnouncement = async (announcementId) => {
        if (!window.confirm("Delete this announcement?")) return;
        try {
           if (!token) throw new Error("Authentication error.");
           // Assuming announcements are deleted via the /api/notices route
           await axios.delete(`/api/notices/${announcementId}`, authHeader);
           refetchClubData(); // Tell the context to refresh
           alert("Announcement deleted.");
        } catch (err) {
            alert('Error deleting announcement.');
            console.error("Delete Announcement Error:", err.response?.data || err);
            if (err.response?.status === 401) navigate('/login');
        }
    };
    
    // --- 4. RENDER based on context state ---
    
    // Get the club name safely
    const clubName = clubData?.clubDetails?.name || 'Club Announcements';
    // Get the announcements from the context
    const announcements = clubData?.recentAnnouncements || [];

    return (
        <Layout userRole={userRole}>
            <h1>{clubName} - Announcements</h1>

            {/* Handle Loading/Error from context */}
            {isLoading && <div className="widget-card"><p>Loading...</p></div>}
            {error && <div className="widget-card error-card"><p className="error-message">{error}</p></div>}

            {/* Only render if NOT loading, NO error, and clubData is loaded */}
            {!isLoading && !error && clubData && (
                <>
                    {/* Create Button (Club reps only) */}
                    {role === 'club' && !showCreateForm && (
                        <button onClick={() => setShowCreateForm(true)} className="action-button" style={{ marginBottom: '1.5rem', width: 'auto' }}>
                            <IoMdAddCircle /> Create New Announcement
                        </button>
                    )}
                    {showCreateForm && (
                        <div className="modal-overlay">
                            <AnnouncementForm
                                clubId={clubData.clubDetails._id}
                                onClose={() => setShowCreateForm(false)}
                                onAnnouncementCreated={handleAnnouncementCreated}
                            />
                        </div>
                    )}

                    {/* List of Announcements */}
                    <div className="announcements-list">
                        {announcements.length === 0 ? (
                            <div className="widget-card"><p>No announcements posted yet.</p></div>
                        ) : (
                            announcements.map(announcement => (
                                <NoticeItem // Reuse NoticeItem for display
                                    key={announcement._id}
                                    notice={announcement} // Pass announcement as notice prop
                                    currentUserRole={userRole}
                                    currentUserId={currentUserId}
                                    onDelete={() => handleDeleteAnnouncement(announcement._id)}
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