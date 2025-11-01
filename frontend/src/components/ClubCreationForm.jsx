import React, { useState,useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import "./DashboardContent.css";
import "./ClubCreationForm.css";

const clubCategories = [
  "Technical",
  "Cultural",
  "Sports",
  "Social",
  "Academic",
  "Arts",
  "Other",
];

// This function will be called when the club is successfully created
function ClubCreationForm({ onClubCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [teamMembers, setTeamMembers] = useState([
    { name: "", role: "President" },
  ]);
  const [facultyList, setFacultyList] = useState([]); 
  const [selectedCoordinator, setSelectedCoordinator] = useState('');
 // const [logoUrl, setLogoUrl] = useState(''); // Add later if needed
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [teamSize, setTeamSize] = useState(1);

   const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const authHeader = { headers: { "x-auth-token": token } };

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        if (token) {
          const res = await axios.get('/api/user/faculty', authHeader);
          setFacultyList(res.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch faculty list:", err);
        // Don't block the form, this is optional
      }
    };
    fetchFaculty();
  }, [token]);

  const handleMemberChange = (index, event) => {
    const values = [...teamMembers];
    values[index][event.target.name] = event.target.value;
    setTeamMembers(values);
  };

  // Add a new, empty member slot
  const handleAddMember = () => {
    setTeamMembers([...teamMembers, { name: "", role: "" }]);
  };

  // Remove a member by their index
  const handleRemoveMember = (index) => {
    // Don't allow removing the last one
    if (teamMembers.length === 1) return;
    const values = [...teamMembers];
    values.splice(index, 1);
    setTeamMembers(values);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!name || !description|| !teamSize) {
      setError("Club name, description and member count are required.");
      setIsLoading(false);
      return;
    }
    const numericTeamSize = parseInt(teamSize, 10);
    if (isNaN(numericTeamSize) || numericTeamSize <= 0) {
        setError('Please enter a valid number for team members (at least 1).');
        setIsLoading(false);
        return;
    }

    const isTeamEmpty = teamMembers.some(
      (member) => member.name === "" || member.role === ""
    );
    if (isTeamEmpty) {
      setError("Please fill out all team member names and roles.");
      setIsLoading(false);
      return;
    }

    const clubData = {
      name,
      description,
      category,
      memberCount: numericTeamSize,
      team: teamMembers, 
      facultyCoordinator: selectedCoordinator || null
    };

    try {
      if (!token) throw new Error("Authentication error.");
      const res = await axios.post(
        "/api/clubs",
       clubData,
        authHeader
      );
      // Call the function passed from DashboardPage to update state
      onClubCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to create club profile.");
      console.error("Club Creation Error:", err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
  localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  return (
    <div className="dashboard-content club-creation-container">
      <button onClick={handleLogout} className="logout-button logout-button-form">
        Logout
      </button>
      
      <h1
        style={{
          color: "white",
          textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
          marginBottom: "0.5rem",
          background: "rgba(0, 0, 0, 0.5)",
          padding: "0.5rem 1rem",
          borderRadius: "4px",
          display: "inline-block",
        }}
      >
        Create Your Club Profile
      </h1>
      <p
        style={{
          color: "white",
          textShadow: "1px 1px 3px rgba(0,0,0,0.6)",
          marginBottom: "2rem",
          textAlign: "center",
          background: "rgba(0, 0, 0, 0.5)",
          padding: "0.5rem 1rem",
          borderRadius: "4px",
          display: "inline-block",
        }}
      >
        Please provide the details for the club you represent.
      </p>
      <div className="widget-card club-creation-form">
        <form onSubmit={handleSubmit}>
          {/* Club Name */}
          <div className="form-group">
            <label htmlFor="clubName">Club Name</label>
            <input
              type="text"
              id="clubName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="clubDescription">Description</label>
            <textarea
              id="clubDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="facultyCoordinator">Faculty Coordinator (Optional)</label>
            <select
              id="facultyCoordinator"
              value={selectedCoordinator}
              onChange={(e) => setSelectedCoordinator(e.target.value)}
            >
              <option value="">-- Select a Coordinator --</option>
              {facultyList.length > 0 ? (
                facultyList.map(faculty => (
                  <option key={faculty._id} value={faculty._id}>
                    {faculty.name}
                  </option>
                ))
              ) : (
                <option disabled>Loading faculty...</option>
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="teamSize">Number of Team Members</label>
            <input
              type="number"
              id="teamSize"
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)} // Update state
              min="1"
              required
            />
          </div>

           <div className="form-group">
            <label>Team Members</label>
            {teamMembers.map((member, index) => (
              <div className="team-member-input" key={index}>
                <input
                  type="text"
                  name="name"
                  placeholder="Member Name"
                  value={member.name}
                  onChange={event => handleMemberChange(index, event)}
                  required
                />
                <input
                  type="text"
                  name="role"
                  placeholder="Role (e.g., President)"
                  value={member.role}
                  onChange={event => handleMemberChange(index, event)}
                  required
                />
                <button
                  type="button"
                  className="remove-member-btn"
                  onClick={() => handleRemoveMember(index)}
                  disabled={teamMembers.length === 1} // Disable remove on last item
                >
                  &times; {/* A simple 'X' icon */}
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

          {/* Category */}
          <div className="form-group">
            <label htmlFor="clubCategory">Category</label>
            <select
              id="clubCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {clubCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Logo URL (Optional for later) */}
          {/* <div className="form-group">
            <label htmlFor="clubLogoUrl">Logo URL (Optional)</label>
            <input type="text" id="clubLogoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          </div> */}

          {error && <p className="error-message">{error}</p>}

          <button
            type="submit"
            className="action-button create-club-btn"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Club Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ClubCreationForm;
