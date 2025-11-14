// frontend/src/components/FacultyDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../components/DashboardContent.css'; // For .widget-card
import '../pages/AttendancePage.css'; // <-- 1. REUSE AttendancePage layout styles
import NoticeModal from './NoticeModal'; // For the "Create Notice" modal
import { IoMdAddCircle } from 'react-icons/io'; // Icon

function FacultyDashboard({ userName }) {
    const [recentNotices, setRecentNotices] = useState([]);
    const [coordinatedClubs, setCoordinatedClubs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const authHeader = { headers: { 'x-auth-token': token } };

    // Fetch data from our existing faculty dashboard route
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        if (!token) { navigate('/login'); return; }

        try {
            const res = await axios.get('/api/user/faculty-dashboard', authHeader);
            setRecentNotices(res.data.recentNotices || []);
            setCoordinatedClubs(res.data.coordinatedClubs || []);
        } catch (err) {
            console.error("Faculty Dashboard Error:", err.response?.data || err);
            setError('Failed to load dashboard data.');
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setIsLoading(false);
        }
    }, [token, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleModalClose = () => {
        setIsNoticeModalOpen(false);
        fetchData(); // Refresh notices after one is posted
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

    return (
        <>
            {/* --- Welcome Headers --- */}
            <h1 style={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                Welcome, {userName}!
            </h1>
            <p style={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.5)', marginBottom: '1.5rem' }}>
                Here are your administrative tools and updates.
            </p>

            {/* --- 2. Use the 'attendance-grid' layout --- */}
            <div className="attendance-grid">
                
                {/* --- 3. Main Content Area (Left) --- */}
                <div className="attendance-main">
                    {/* Create Notice Card */}
                    <div className="widget-card">
                        <h3>Create a New Notice</h3>
                        <p>Post an official notice for students, faculty, or all users.</p>
                        <button 
                            className="action-button" 
                            onClick={() => setIsNoticeModalOpen(true)}
                            style={{ width: '100%' }} // Make button full width
                        >
                            <IoMdAddCircle /> Create Notice
                        </button>
                    </div>

                    {/* Recent Notices Card */}
                    <div className="widget-card">
                        <h3>Recent Notices</h3>
                        {isLoading ? (
                            <p>Loading notices...</p>
                        ) : error ? (
                            <p className="error-message">{error}</p>
                        ) : recentNotices.length > 0 ? (
                            <ul className="dashboard-list">
                                {recentNotices.map(notice => (
                                    <li key={notice._id}>
                                        {notice.title} - <small>({formatDate(notice.createdAt)})</small>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>You haven't posted any notices yet.</p>
                        )}
                        <div className="card-actions">
                            <Link to="/notices" className="card-link">View All Notices</Link>
                        </div>
                    </div>
                </div>

                {/* --- 4. Sidebar Area (Right) --- */}
                <div className="attendance-sidebar">
                    {/* Coordinated Clubs Card */}
                    <div className="widget-card">
                        <h3>My Coordinated Clubs</h3>
                        {isLoading ? (
                            <p>Loading clubs...</p>
                        ) : coordinatedClubs.length > 0 ? (
                            <ul className="dashboard-list">
                                {coordinatedClubs.map(club => (
                                    <li key={club._id}>{club.name}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>You are not coordinating any clubs.</p>
                        )}
                        <div className="card-actions">
                            <Link to="/my-clubs" className="card-link">View Club Directory</Link>
                        </div>
                    </div>

                    {/* Profile Card */}
                    <div className="widget-card">
                        <h3>My Profile</h3>
                        <p>View and manage your account details and password.</p>
                        <div className="card-actions">
                            <Link to="/profile" className="action-button" style={{ width: '100%',color:"white" }}>
                                Go to Profile
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 5. Render Notice Modal (it's hidden by default) --- */}
            {isNoticeModalOpen && (
                 <div className="modal-overlay">
                    <NoticeModal
                        isOpen={isNoticeModalOpen}
                        onClose={handleModalClose}
                        onNoticeCreated={handleModalClose}
                    />
                 </div>
            )}
        </>
    );
}

export default FacultyDashboard;