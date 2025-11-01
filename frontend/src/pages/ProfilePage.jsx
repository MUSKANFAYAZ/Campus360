import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../components/DashboardContent.css'; 
import './ProfilePage.css'; 
import Layout from '../components/Layout';
import EditProfileModal from '../components/EditProfileModal';
import ChangePasswordModal from '../components/ChangePasswordModal';

function ProfilePage() {
  const [userProfile, setUserProfile] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const authHeader = { headers: { 'x-auth-token': token } };
  const userRole = localStorage.getItem('userRole');

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError('');
      if (!token) { navigate('/login'); return; } 

      try {
        const res = await axios.get('/api/auth/me', authHeader); 
        setUserProfile(res.data); 
      } catch (err) {
        setError('Failed to load profile data.');
        console.error("Fetch Profile Error:", err.response?.data || err);
        if (err.response?.status === 401) navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]); 

  const handleProfileUpdate = (updatedUser) => {
    setUserProfile(updatedUser); 
    localStorage.setItem('userName', updatedUser.name);//welcome kashifa upadte
  };

  // Display user information
  return (
   <Layout userRole={userRole}>
     <h1>My Profile</h1>  
  
     {isLoading && <p>Loading profile...</p>}
     
     {error && <p className="error-message">{error}</p>}

     {!isLoading && !error && !userProfile && (
        <p>Could not load user profile.</p>
     )}
    

     {!isLoading && !error && userProfile && (
       <>
         <div className="widget-card profile-card">
           <h2>Profile Details</h2>
           <div className="profile-info">
             <p>
               <strong>Name:</strong>{' '}
               <span className="user-detail-value">{userProfile.name}</span> 
             </p>
             <p>
               <strong>Email:</strong>{' '}
               <span className="user-detail-value">{userProfile.email}</span> 
             </p>
             <p>
               <strong>Role:</strong>{' '}
               <span className="user-detail-value">{userProfile.role || 'Not Set'}</span> 
             </p>
           </div>
          <button 
             className="action-button edit-profile-btn"
             onClick={() => setIsModalOpen(true)} 
           >
             Edit Profile
           </button>
         </div>

         <div className="widget-card security-card">
           <h2>Security</h2>
           <button 
             className="action-button change-password-btn"
             onClick={() => setIsPasswordModalOpen(true)} // Open Password modal
           >
             Change Password
           </button>
         </div>

         <EditProfileModal
           isOpen={isModalOpen}
           onClose={() => setIsModalOpen(false)}
           user={userProfile}
           onProfileUpdate={handleProfileUpdate}
         />
         <ChangePasswordModal
           isOpen={isPasswordModalOpen}
           onClose={() => setIsPasswordModalOpen(false)}
         />
       </>
     )}
   </Layout>
  );
}

export default ProfilePage;