// frontend/src/pages/MyClubsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import '../components/DashboardContent.css'; // For .widget-card
import '../pages/ClubsPage.css'; // Reuse club card styles

function MyClubsPage() {
    const [myClubs, setMyClubs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const authHeader = { headers: { 'x-auth-token': token } };

    // Fetch only the clubs coordinated by this faculty
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        if (!token) { navigate('/login'); return; }
        try {
            const res = await axios.get('/api/clubs/my-coordinated-clubs', authHeader);
            setMyClubs(res.data || []);
        } catch (err) {
            setError('Failed to load your clubs.');
            console.error("Fetch Coordinated Clubs Error:", err.response?.data || err);
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setIsLoading(false);
        }
    }, [token, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <Layout userRole={userRole}>
            <h1 style={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                My Coordinated Clubs
            </h1>
            <p style={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.5)', marginBottom: '1.5rem' }}>
                Manage and oversee the clubs you coordinate.
            </p>

            {isLoading && <div className="widget-card"><p>Loading clubs...</p></div>}
            {error && <div className="widget-card error-card"><p className="error-message">{error}</p></div>}

            {!isLoading && !error && (
                <div className="clubs-list-container">
                    {myClubs.length === 0 ? (
                        <div className="widget-card">
                            <p>You are not currently assigned as a coordinator for any clubs.</p>
                        </div>
                    ) : (
                        myClubs.map(club => (
                            <div key={club._id} className="widget-card club-card">
                                <div className="club-info">
                                    <h3>{club.name}</h3>
                                    <span className="club-category">{club.category}</span>
                                    <p>{club.description}</p>
                                    <p className="coordinator">
                                        Representative: {club.representative ? club.representative.name : 'Not Set'}
                                    </p>
                                </div>
                                <div className="club-actions">
                                    {/* Add a link to view the club's dashboard */}
                                    <button 
                                        className="action-button"
                                        onClick={() => alert('Faculty club management page not yet built.')}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </Layout>
    );
}

export default MyClubsPage;