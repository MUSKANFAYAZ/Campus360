import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import '../components/DashboardContent.css';
import './ClubFollowersPage.css'; 
import { BsTrashFill } from 'react-icons/bs';

function ClubFollowersPage() {
    const [followers, setFollowers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState(''); // State for the search/filter input

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const authHeader = { headers: { 'x-auth-token': token } };

    // Fetch the full follower list
    const fetchFollowers = useCallback(async () => {
        setIsLoading(true);
        setError('');
        if (!token) { navigate('/login'); return; }
        try {
            const res = await axios.get('/api/clubs/myclub/followers', authHeader);
            setFollowers(res.data || []);
        } catch (err) {
            setError('Failed to load followers.');
            console.error("Fetch Followers Error:", err.response?.data || err);
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setIsLoading(false);
        }
    }, [token, navigate]);

    useEffect(() => {
        fetchFollowers();
    }, [fetchFollowers]);

    // Handle the remove follower action
    const handleRemoveFollower = async (followerId, followerName) => {
        if (!window.confirm(`Are you sure you want to remove ${followerName} from your followers?`)) {
            return;
        }
        try {
            await axios.put('/api/clubs/myclub/remove-follower',
                { userIdToRemove: followerId }, // Send the ID in the body
                authHeader
            );
            alert(`${followerName} has been removed.`);
            // Refresh the list
            fetchFollowers();
        } catch (err) {
            alert('Failed to remove follower.');
            console.error("Remove Follower Error:", err.response?.data || err);
        }
    };

    // Filter followers based on the search input
    const filteredFollowers = followers.filter(follower =>
        follower.name.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <Layout userRole={userRole}>
            <h1>Manage Followers</h1>
            
            <div className="widget-card follower-management-card">
                <div className="follower-header">
                    <h2>Total Followers: {followers.length}</h2>
                    <input
                        type="text"
                        placeholder="Search followers..."
                        className="follower-search"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                {isLoading && <p>Loading followers...</p>}
                {error && <p className="error-message">{error}</p>}

                {!isLoading && !error && (
                    <ul className="follower-list">
                        {filteredFollowers.length === 0 ? (
                            <li className="follower-item empty">
                                {followers.length === 0 ? "You have no followers yet." : "No followers match your search."}
                            </li>
                        ) : (
                            filteredFollowers.map(follower => (
                                <li key={follower._id} className="follower-item">
                                    <div className="follower-details">
                                        <span className="follower-name">{follower.name}</span>
                                        <span className="follower-email">{follower.email}</span>
                                    </div>
                                    <button
                                        className="action-button remove-follower-btn"
                                        onClick={() => handleRemoveFollower(follower._id, follower.name)}
                                    >
                                        <BsTrashFill /> Remove
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                )}
            </div>
        </Layout>
    );
}

export default ClubFollowersPage;