// frontend/src/pages/ClubSettingsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useClub } from '../context/ClubContext'; 
import '../components/DashboardContent.css'; 
import '../components/ClubCreationForm.css'; 
import './ProfilePage.css'; 


const clubCategories = ['Technical', 'Cultural', 'Sports', 'Social', 'Academic', 'Arts', 'Other'];

function ClubSettingsPage() {
    
    const { clubData, isLoading: isContextLoading, error: contextError, refetchClubData } = useClub();
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Other');
    const [memberCount, setMemberCount] = useState('');
    const [teamMembers, setTeamMembers] = useState([{ name: '', role: '' }]); // Start with one
    const [facultyList, setFacultyList] = useState([]);
    const [selectedCoordinator, setSelectedCoordinator] = useState('');
    
    // UI State
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const authHeader = { headers: { 'x-auth-token': token } };

    // This useEffect populates the form once the context is loaded
    useEffect(() => {
        if (clubData && clubData.clubDetails) {
            const { clubDetails } = clubData;
            setName(clubDetails.name || '');
            setDescription(clubDetails.description || '');
            setCategory(clubDetails.category || 'Other');
            setMemberCount(String(clubDetails.memberCount || ''));
            // Ensure teamMembers is an array, even if empty
            setTeamMembers(clubDetails.team && clubDetails.team.length > 0 ? clubDetails.team : [{ name: '', role: '' }]);
            // Pre-fill coordinator ID (handles populated object or simple ID)
            setSelectedCoordinator(clubData.clubDetails.facultyCoordinator?._id || clubData.clubDetails.facultyCoordinator || '');
        }

        // Fetch faculty list (this is separate from club data)
        const fetchFaculty = async () => {
            try {
                if (token) {
                    const res = await axios.get('/api/user/faculty', authHeader);
                    setFacultyList(res.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch faculty list:", err);
            }
        };
        fetchFaculty();
    }, [clubData, token]); // Re-run if clubData from context changes

    
    // --- Team Member Handlers ---
    const handleMemberChange = (index, event) => {
        const values = [...teamMembers];
        values[index][event.target.name] = event.target.value;
        setTeamMembers(values);
    };

    const handleAddMember = () => {
        setTeamMembers([...teamMembers, { name: "", role: "" }]);
    };

    const handleRemoveMember = (index) => {
        const values = [...teamMembers];
        values.splice(index, 1);
        setTeamMembers(values);
    };

    // --- Main Form Handlers ---
    const handleUpdate = async (e) => {
        e.preventDefault();
        setFormError("");
        setFormSuccess("");
        setIsSaving(true);

        // Validation
        const isTeamEmpty = teamMembers.some(member => member.name === "" || member.role === "");
        if (isTeamEmpty && teamMembers.length > 0) {
            setFormError("Please fill out all team member names and roles, or remove empty rows.");
            setIsSaving(false);
            return;
        }
        const numericMemberCount = parseInt(memberCount, 10);
        if (isNaN(numericMemberCount) || numericMemberCount <= 0) {
            setFormError("Member count must be a valid number greater than 0.");
            setIsSaving(false);
            return;
        }

        try {
            const updatedData = {
                name,
                description,
                category,
                team: teamMembers,
                memberCount: numericMemberCount,
                facultyCoordinator: selectedCoordinator || null
            };
            
            // Call the PUT route to update
            const res = await axios.put("/api/clubs/myclub", updatedData, authHeader);
            
            // Re-sync form state with the saved data
            const savedData = res.data;
            setName(savedData.name);
            setDescription(savedData.description);
            setCategory(savedData.category);
            setMemberCount(String(savedData.memberCount || ''));
            setTeamMembers(savedData.team || [{ name: '', role: '' }]);
            setSelectedCoordinator(savedData.facultyCoordinator || '');

            setFormSuccess("Club profile updated successfully!");
            
            // Tell the global context to refetch all data
            refetchClubData(); 

        } catch (err) {
            setFormError(err.response?.data?.msg || "Failed to update profile.");
            console.error("Update Club Error:", err.response?.data || err);
        } finally {
            setIsSaving(false);
        }
    };

    // Handle club DELETION
    const handleDelete = async () => {
        if (!clubData?.clubDetails) return;

        if (
            !window.confirm(
                `ARE YOU SURE you want to delete "${clubData.clubDetails.name}"?\n\nThis will remove all announcements, events, and followers.`
            )
        ) return;
        
        if (
            !window.confirm(
                `FINAL CONFIRMATION: This action cannot be undone. Delete "${clubData.clubDetails.name}"?`
            )
        ) return;

        setIsSaving(true);
        setFormError("");
        setFormSuccess("");
        try {
            const res = await axios.delete("/api/clubs/myclub", authHeader);
            alert(res.data.msg);
            
            // Clear local storage and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('userName');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            navigate("/login"); // Redirect to login page

        } catch (err) {
            setFormError(err.response?.data?.msg || "Failed to delete club.");
            console.error("Delete Club Error:", err.response?.data || err);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Render Logic ---

    // 1. Handle Loading State (from context)
    if (isContextLoading) {
        return (
            <Layout userRole={userRole}>
                <p style={{color:"white"}}>Loading settings...</p>
            </Layout>
        );
    }

    // 2. Handle Error State (from context)
    if (contextError) {
        return (
            <Layout userRole={userRole}>
                <h1 style={{ color: "white" }}>Error</h1>
                <p className="error-message">{contextError}</p>
            </Layout>
        );
    }

    // 3. Handle No Club Found (from context)
    if (!clubData || !clubData.clubDetails) {
        return (
            <Layout userRole={userRole}>
                <h1>Club Settings</h1>
                <div className="widget-card">
                    <p>No club found to edit. Please create a club profile first.</p>
                </div>
            </Layout>
        );
    }

    // 4. Main content (data is loaded)
    return (
        <Layout userRole={userRole}>
            {/* Use h1 for page title */}
            <h1 style={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                Club Settings: {clubData.clubDetails.name}
            </h1>

            {/* Edit Profile Form */}
            <div
                className="widget-card club-creation-form" // Reuse styles
                style={{ maxWidth: "800px", margin: "0 auto" }}
            >
                <form onSubmit={handleUpdate}>
                    <h2>Update Details</h2>
                    
                    {/* Name */}
                    <div className="form-group">
                        <label htmlFor="clubName">Club Name</label>
                        <input type="text" id="clubName" value={name}
                            onChange={(e) => setName(e.target.value)} required
                        />
                    </div>
                    
                    {/* Description */}
                    <div className="form-group">
                        <label htmlFor="clubDescription">Description</label>
                        <textarea id="clubDescription" value={description}
                            onChange={(e) => setDescription(e.target.value)} required rows={6}
                        />
                    </div>
                    
                    {/* Category */}
                    <div className="form-group">
                        <label htmlFor="clubCategory">Category</label>
                        <select id="clubCategory" value={category} onChange={(e) => setCategory(e.target.value)}>
                            {clubCategories.map((cat) => ( <option key={cat} value={cat}>{cat}</option> ))}
                        </select>
                    </div>

                    {/* Faculty Coordinator */}
                    <div className="form-group">
                        <label htmlFor="facultyCoordinator">Faculty Coordinator (Optional)</label>
                        <select
                            id="facultyCoordinator"
                            value={selectedCoordinator}
                            onChange={(e) => setSelectedCoordinator(e.target.value)}
                        >
                            <option value="">-- Select a Coordinator --</option>
                            {facultyList.length > 0 ? (
                                facultyList.map((faculty) => (
                                    <option key={faculty._id} value={faculty._id}>
                                        {faculty.name}
                                    </option>
                                ))
                            ) : ( <option disabled>Loading faculty...</option> )}
                        </select>
                    </div>

                    {/* Member Count */}
                    <div className="form-group">
                        <label htmlFor="memberCount">Total Number of Members</label>
                        <input
                            type="number" id="memberCount"
                            value={memberCount ?? ""}
                            onChange={(e) => setMemberCount(e.target.value)}
                            min="1" required
                        />
                    </div>
                    
                    {/* Team Members */}
                    <div className="form-group">
                        <label>Team Members (Leaders)</label>
                        {teamMembers.map((member, index) => (
                            <div className="team-member-input" key={index}>
                                <input
                                    type="text" name="name" placeholder="Member Name"
                                    value={member.name || ""}
                                    onChange={(event) => handleMemberChange(index, event)}
                                    required
                                />
                                <input
                                    type="text" name="role" placeholder="Role (e.g., President)"
                                    value={member.role || ""}
                                    onChange={(event) => handleMemberChange(index, event)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="remove-member-btn"
                                    onClick={() => handleRemoveMember(index)}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            className="add-member-btn"
                            onClick={() => handleAddMember()}
                        >
                            + Add Another Member
                        </button>
                    </div>

                    {/* Feedback Messages */}
                    {formSuccess && <p className="success-message">{formSuccess}</p>}
                    {formError && <p className="error-message">{formError}</p>}

                    <button
                        type="submit"
                        className="action-button"
                        disabled={isSaving}
                        style={{ width: "100%" }}
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </form>
            </div>

            {/* Delete Club Section */}
            <div
                className="widget-card security-card" // Reuse styles
                style={{ marginTop: "2rem", maxWidth: "800px", margin: "2rem auto" }}
            >
                <h2>Danger Zone</h2>
                <p style={{ color: "black", fontSize: "1rem" }}> {/* Adjusted text size */}
                    Deleting your club is permanent. It will remove all associated
                    announcements, events, and followers.
                </p>
                <button
                    onClick={handleDelete}
                    className="action-button change-password-btn" // Reuses red button style
                    disabled={isSaving}
                >
                    {isSaving ? "Deleting..." : `Delete ${clubData.clubDetails.name}`}
                </button>
            </div>
        </Layout>
    );
}

export default ClubSettingsPage;