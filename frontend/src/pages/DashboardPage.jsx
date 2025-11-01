// frontend/src/pages/DashboardPage.jsx
import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../components/DashboardContent.css";
import axios from "axios";

// --- Component Imports ---
import Layout from "../components/Layout";
import FullScreenBgLayout from "../components/FullScreenBgLayout";
import RoleSelection from "../components/RoleSelection";
import StudentDashboard from "../components/StudentDashboard";
// import FacultyDashboard from '../components/FacultyDashboard';
import ClubDashboard from "../components/ClubDashboard";
import ClubCreationForm from "../components/ClubCreationForm";

function DashboardPage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "User";
  const token = localStorage.getItem("token");
  const authHeader = { headers: { "x-auth-token": token } };

  // --- State ---
  const getInitialRole = () => {
    const role = localStorage.getItem("userRole");
    return role === "null" || !role ? null : role;
  };
  const [userRole, setUserRole] = useState(getInitialRole());
  const [clubDashboardData, setClubDashboardData] = useState(undefined);
  const [isLoadingClub, setIsLoadingClub] = useState(true);

  // --- Fetch Managed Club if Role is 'club' ---
  const checkManagedClub = useCallback(async () => {
    if (userRole === "club" && token) {
      setIsLoadingClub(true);
      try {
        const res = await axios.get("/api/clubs/myclub", authHeader);
        setClubDashboardData(res.data);
      } catch (err) {
        console.error("Error checking managed club:", err.response?.data?.msg || err);
        if (err.response?.status === 401) { navigate("/login"); }
        setClubDashboardData(null);
      } finally {
        setIsLoadingClub(false);
      }
    } else {
      setIsLoadingClub(false); // Not a club user, no need to load
    }
  }, [userRole, token, navigate]);

  useEffect(() => {
    checkManagedClub();
  }, [checkManagedClub]);

  // --- Handlers ---
  const handleLogout = () => {
    localStorage.clear(); // Use clear() for a full logout
    navigate("/login");
  };
  const handleRoleSet = (newRole) => { setUserRole(newRole); };
  const handleClubCreated = () => { checkManagedClub(); };

  // --- Render Logic ---

  // 1. If role is not set, show RoleSelection (NO Layout)
  if (!userRole) {
    return <RoleSelection onRoleSet={handleRoleSet} />;
  }

  if (userRole === 'club') {
    if (isLoadingClub || clubDashboardData === undefined) {
      return (
       <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: 'white',
          backgroundImage: "url('/background.jpg')", 
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          <p style={{
            background: 'rgba(0,0,0,0.5)', 
            padding: '1rem 2rem',
            borderRadius: '8px'
          }}>
            Loading Club Information...
          </p>
        </div>
      );
    }
    
    // 2b. Loading finished, and NO club exists
    if (clubDashboardData === null) {
      // Render the creation form with its own full-screen background (NO Layout)
      return (
        <FullScreenBgLayout>
          <ClubCreationForm onClubCreated={handleClubCreated} />
        </FullScreenBgLayout>
      );
    }
  }

  return (
    <Layout userRole={userRole}>
      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>

      {(() => {
        switch (userRole) {
          case "student":
            return <StudentDashboard userName={userName} />;
          // case 'faculty':
          //   return <FacultyDashboard userName={userName} />;
          case "club":
            return (
              <ClubDashboard
                userName={userName}
                clubDetails={clubDashboardData.clubDetails}
                initialAnnouncements={clubDashboardData.recentAnnouncements}
                initialEvents={clubDashboardData.upcomingEvents}
                initialFollowers={clubDashboardData.followers}
                onDataRefresh={checkManagedClub} // Pass the refetch function
              />
            );
          default:
            return <p>Role not recognized or dashboard not implemented yet.</p>;
        }
      })()}
    </Layout>
  );
}

export default DashboardPage;