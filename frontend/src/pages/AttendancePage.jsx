import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './AttendancePage.css';
import '../components/DashboardContent.css';
import SubjectModal from '../components/SubjectModal';
import { BsPlusCircleFill, BsTrashFill } from 'react-icons/bs'; 
import { IoMdAddCircle } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

function AttendancePage() {
  const [subjects, setSubjects] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceGoal, setAttendanceGoal] = useState('75');
  const [savedAttendanceGoal, setSavedAttendanceGoal] = useState('75');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [extraClassToggleState, setExtraClassToggleState] = useState({});
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [subjectsToDelete, setSubjectsToDelete] = useState([]);

  const userRole = localStorage.getItem('userRole');
  const navigate = useNavigate(); 
  const token = localStorage.getItem('token');
  const authHeader = { headers: { 'x-auth-token': token } };


  const fetchData = useCallback(async () => {
    if (!token) {
      console.error("No token found, cannot fetch data.");
      navigate('/login'); 
      return;
    }
    try {
      const [subjectsRes, attendanceRes, goalRes] = await Promise.all([
        axios.get('/api/attendance/subjects', authHeader),
        axios.get('/api/attendance', authHeader),
        axios.get('/api/user/attendance-goal', authHeader),
      ]);

      setSubjects(subjectsRes.data || []);
      setAttendanceRecords(attendanceRes.data || []);

      const fetchedGoal = String(goalRes.data?.attendanceGoal ?? '75');
      setAttendanceGoal(fetchedGoal);
      setSavedAttendanceGoal(fetchedGoal);

      const dateStr = selectedDate.toISOString().split('T')[0];
      const newExtraToggleState = {};
      (attendanceRes.data || [])
        .filter(rec => new Date(rec.date).toISOString().split('T')[0] === dateStr && rec.isExtraClass && rec.status === 'extra_present')
        .forEach(rec => {
          if (rec.subject?._id) {
            newExtraToggleState[rec.subject._id] = true;
          }
        });
      setExtraClassToggleState(newExtraToggleState);

    } catch (err) {
      console.error("Error fetching data:", err.response?.data?.msg || err.message);
      if (err.response?.status === 401) {
        console.error("Authentication error (401). Token might be invalid or expired.");
        // Clear invalid token and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        navigate('/login');
      }
    }
  }, [token, selectedDate, navigate]); 

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const getAttendanceStatusForSubject = (subjectId, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const record = attendanceRecords.find(
      (rec) =>
        rec.subject?._id === subjectId &&
        new Date(rec.date).toISOString().split('T')[0] === dateStr &&
        !rec.isExtraClass
    );
    return record ? record.status : 'no-data';
  };

  const getExtraClassStatusForSubject = (subjectId, date) => {
    if (extraClassToggleState[subjectId] !== undefined) {
      return extraClassToggleState[subjectId];
    }
    const dateStr = date.toISOString().split('T')[0];
    return attendanceRecords.some(
      (rec) =>
        rec.subject?._id === subjectId &&
        new Date(rec.date).toISOString().split('T')[0] === dateStr &&
        rec.isExtraClass &&
        rec.status === 'extra_present'
    );
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleAttendanceUpdate = async (records) => {
    if (!token) { /* ... auth error handling ... */ return; }
    try {
      await axios.post('/api/attendance', { records: records }, authHeader);
      fetchData();
    } catch (err) { /* ... error handling ... */ }
  };

  const handleRegularAttendanceChange = (subjectId, status) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    handleAttendanceUpdate([{ subjectId, date: dateStr, status, isExtraClass: false }]);
  };

  const handleExtraClassToggle = (subjectId) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const isCurrentlyMarkedExtra = extraClassToggleState[subjectId] ?? getExtraClassStatusForSubject(subjectId, selectedDate);
    const newIsExtraClassState = !isCurrentlyMarkedExtra;
    setExtraClassToggleState(prev => ({ ...prev, [subjectId]: newIsExtraClassState }));
    handleAttendanceUpdate([{ subjectId, date: dateStr, status: 'extra_present', isExtraClass: newIsExtraClassState }]);
  };

  const handleSubjectAdded = (newSubject) => {
    setSubjects(prev => [...prev, newSubject]);
    fetchData();
  };

  const toggleRemoveMode = () => {
    setIsRemoveMode(!isRemoveMode);
    setSubjectsToDelete([]);
  };

  const handleSubjectSelectionChange = (subjectId) => {
    setSubjectsToDelete(prev =>
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleConfirmDelete = async () => {
    if (subjectsToDelete.length === 0 || !token) { /* ... error handling ... */ return; }
    if (!window.confirm(`Remove ${subjectsToDelete.length} subject(s) and related attendance?`)) { return; }
    try {
      const res = await axios.delete('/api/attendance/subjects', { headers: authHeader.headers, data: { subjectIds: subjectsToDelete } });
      alert(res.data.msg || 'Subjects deleted.');
      setSubjectsToDelete([]);
      setIsRemoveMode(false);
      fetchData();
    } catch (err) { /* ... error handling ... */ }
  };

  const handleGoalChange = async () => {
    const numericGoal = parseInt(attendanceGoal, 10);
    if (isNaN(numericGoal) || numericGoal < 0 || numericGoal > 100 || !token) { /* ... validation/auth check ... */ return; }
    try {
      const res = await axios.put('/api/user/attendance-goal', { goal: numericGoal }, authHeader);
      const savedGoalStr = String(res.data.attendanceGoal);
      setAttendanceGoal(savedGoalStr);
      setSavedAttendanceGoal(savedGoalStr);
      alert('Goal updated!');
    } catch (err) {}
  };

 
  const calculateSubjectStats = useCallback((subjectId) => {
    const goal = parseInt(savedAttendanceGoal, 10) || 0;
    const subject = subjects.find(s => s._id === subjectId);
    const subjectNameForLog = subject ? subject.name : `ID: ${subjectId}`;

    let present = 0, absent = 0, cancelled = 0, extraPresent = 0;
    const today = new Date().setUTCHours(0, 0, 0, 0);

    attendanceRecords
      .filter(rec => rec.subject?._id === subjectId && new Date(rec.date).setUTCHours(0, 0, 0, 0) <= today)
      .forEach(rec => {
        if (rec.isExtraClass) { if (rec.status === 'extra_present') extraPresent++; }
        else {
          if (rec.status === 'present') present++;
          else if (rec.status === 'absent') absent++;
          else if (rec.status === 'cancelled') cancelled++;
        }
      });

    const effectivePresent = present + extraPresent; // Total classes I attended
    const totalCountedClasses = present + absent; // Total scheduled classes 

    
    let percentage = totalCountedClasses === 0 ? 100 : (effectivePresent / totalCountedClasses) * 100;
    let displayPercentage = Math.min(percentage, 100); 

    let maxBunksAvailable = 0;

    if (percentage < goal) {
        maxBunksAvailable = 0; // If you're already below, you have 0 bunks
    } else {
        // (100 * (Attended+Extra) / Goal) = Total classes you can have
        // Subtract (Attended+Absent) to find how many more you can miss
        maxBunksAvailable = Math.floor((100 * effectivePresent / goal) - totalCountedClasses);
        if (maxBunksAvailable < 0) maxBunksAvailable = 0;
    }
    
  
    return {
      present, absent, cancelled, extraPresent,
      percentage: displayPercentage.toFixed(1), 
      maxBunksAvailable: Math.floor(maxBunksAvailable),
    };
  }, [attendanceRecords, subjects, savedAttendanceGoal]);
 

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      const hasAbsence = attendanceRecords.some(rec => new Date(rec.date).toISOString().split('T')[0] === dateStr && rec.status === 'absent' && !rec.isExtraClass);
      const hasPresent = attendanceRecords.some(rec => new Date(rec.date).toISOString().split('T')[0] === dateStr && rec.status === 'present' && !rec.isExtraClass);
      const hasExtra = attendanceRecords.some(rec => new Date(rec.date).toISOString().split('T')[0] === dateStr && rec.isExtraClass && rec.status === 'extra_present');
      let classes = [];
      if (hasAbsence) classes.push('day-with-absence');
      if (hasPresent) classes.push('day-with-present');
      if (hasExtra) classes.push('day-with-extra');
      if (dateStr === selectedDate.toISOString().split('T')[0]) { classes.push('react-calendar__tile--active-date'); }
      return classes.join(' ') || null;
    } return null;
  };

  const isGoalUnchanged = attendanceGoal === savedAttendanceGoal;


  const dayAbbreviations = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Layout userRole={userRole}>
      <h1>My Attendance</h1>

      <div className="widget-card attendance-settings">
        <label htmlFor="goal">Target Attendance: </label>
        <input type="number" id="goal" value={attendanceGoal ?? ''} onChange={(e) => setAttendanceGoal(e.target.value || '')} min="0" max="100" className="goal-input" /> %
        <button onClick={handleGoalChange} className="action-button" disabled={isGoalUnchanged}>Set Goal</button>
      </div>

      <div className="attendance-grid">
      
        <div className="attendance-main">
          <div className="widget-card daily-timetable">
            <h2>Timetable for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
            {!subjects || subjects.length === 0 ? (
              <p>No subjects added yet.</p>
            ) : (
              subjects.map(subject => {
                const currentStatus = getAttendanceStatusForSubject(subject._id, selectedDate);
                const isExtraMarked = extraClassToggleState[subject._id] || false;
                const dayIndex = selectedDate.getDay();
                if (!subject.days || !subject.days.includes(dayIndex)) {
                    return null; 
                }
                return (
                  <div key={subject._id} className="timetable-item">
                    <h3>{subject.name}</h3>
                    <div className="item-actions">
                      <div className="status-buttons">
                        <button className={currentStatus === 'present' ? 'present active' : ''} onClick={() => handleRegularAttendanceChange(subject._id, 'present')}>Present</button>
                        <button className={currentStatus === 'absent' ? 'absent active' : ''} onClick={() => handleRegularAttendanceChange(subject._id, 'absent')}>Absent</button>
                        <button className={currentStatus === 'cancelled' ? 'cancelled active' : ''} onClick={() => handleRegularAttendanceChange(subject._id, 'cancelled')}>Cancelled</button>
                      </div>
                      <button className={`extra-class-btn ${isExtraMarked ? 'active' : ''}`} onClick={() => handleExtraClassToggle(subject._id)} title={isExtraMarked ? "Remove Extra" : "Mark Extra"}>
                        <BsPlusCircleFill /> {isExtraMarked ? 'Extra ✓' : 'Extra'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
           
             {subjects.length > 0 && subjects.filter(s => s.days?.includes(selectedDate.getDay())).length === 0 && (
                <p>No classes scheduled for this day.</p>
             )}
          </div>

        
          <div className="widget-card stats-card">
            <h2>Statistics</h2>
            {!subjects || subjects.length === 0 ? ( <p>Add subjects to see statistics.</p> ) : (
              subjects.map(subject => {
                const stats = calculateSubjectStats(subject._id);
                const goalNumber = parseInt(savedAttendanceGoal, 10) || 0;
                return (
                  <div key={subject._id} className="subject-stats-item">
                    <h4>{subject.name}</h4>
                    <div className="stats-row">
                      <p>Attendance: <strong className={parseFloat(stats.percentage) < goalNumber ? 'low-attendance' : ''}>{stats.percentage}%</strong></p>
                      <p>Bunks Left: <strong className={stats.maxBunksAvailable <= 0 ? 'low-attendance' : ''}>{stats.maxBunksAvailable}</strong></p>
                    </div>
                    <div className="stats-details">
                      <span>Attended: {stats.present}</span> <span>Absent: {stats.absent}</span> <span>Cancelled: {stats.cancelled}</span> <span>Extra: {stats.extraPresent}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

       
        <div className="attendance-sidebar">
          <Calendar onChange={handleDateChange} value={selectedDate} tileClassName={tileClassName} />
          <div className="widget-card subject-management">
            <h3>Manage Subjects</h3>
            {!subjects || subjects.length === 0 ? ( <p>No subjects added yet.</p> ) : (
              <ul className={`subject-list ${isRemoveMode ? 'remove-mode' : ''}`}>
                {subjects.map(s => (
                  <li key={s._id} onClick={isRemoveMode ? () => handleSubjectSelectionChange(s._id) : undefined}>
                    {isRemoveMode && (
                      <input type="checkbox" className="subject-delete-checkbox" checked={subjectsToDelete.includes(s._id)} onChange={() => handleSubjectSelectionChange(s._id)} onClick={(e) => e.stopPropagation()} />
                    )}
                    <span>{s.name}</span>
                    <span className="subject-days">({(s.days || []).sort().map(dayIndex => dayAbbreviations[dayIndex]).join(', ')})</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="subject-actions">
              {!isRemoveMode ? (
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setIsSubjectModalOpen(true)} className="action-button"><IoMdAddCircle /> Add </button>
                  <button onClick={toggleRemoveMode} className="action-button remove-button" disabled={!subjects || subjects.length === 0}> <BsTrashFill /> Remove </button>
                </div>
              ) : (
                <>
                  <button onClick={handleConfirmDelete} className="action-button confirm-delete-button" disabled={subjectsToDelete.length === 0}>Delete ({subjectsToDelete.length})</button>
                  <br></br>
                  <br></br>
                  <button onClick={toggleRemoveMode} className="action-button cancel-button">Cancel</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

     
      <SubjectModal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} onSubjectAdded={handleSubjectAdded} />
    </Layout>
  );
}
export default AttendancePage;