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
    const { clubData, isLoading, error, refetchClubData } = useClub();
    
    const [showCreateForm, setShowCreateForm] = useState(false);
    
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole'); 
    const role = userRole ? userRole.toLowerCase() : '';
    const currentUserId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const authHeader = { headers: { 'x-auth-token': token } };

    const handleAnnouncementCreated = () => {
        refetchClubData(); 
        setShowCreateForm(false);
    };

    const handleDeleteAnnouncement = async (announcementId) => {
        if (!window.confirm("Delete this announcement?")) return;
        try {
           if (!token) throw new Error("Authentication error.");
           await axios.delete(`/api/notices/${announcementId}`, authHeader);
           refetchClubData(); 
           alert("Announcement deleted.");
        } catch (err) {
            alert('Error deleting announcement.');
            console.error("Delete Announcement Error:", err.response?.data || err);
            if (err.response?.status === 401) navigate('/login');
        }
    };
    
    const clubName = clubData?.clubDetails?.name || 'Club Announcements';
    const announcements = clubData?.recentAnnouncements || [];

    return (
        <Layout userRole={userRole}>
            <h1>{clubName} - Announcements</h1>

            {isLoading && <div className="widget-card"><p>Loading...</p></div>}
            {error && <div className="widget-card error-card"><p className="error-message">{error}</p></div>}

            {!isLoading && !error && clubData && (
                <>
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

                    <div className="announcements-list">
                        {announcements.length === 0 ? (
                            <div className="widget-card"><p>No announcements posted yet.</p></div>
                        ) : (
                            announcements.map(announcement => (
                                <NoticeItem
                                    key={announcement._id}
                                    notice={announcement} 
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