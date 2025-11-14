import { NavLink } from 'react-router-dom';
import { BsGridFill, BsCalendarCheck, BsBellFill, BsPeopleFill, BsPersonFill, BsMegaphoneFill, BsCalendarEventFill, BsGearFill } from 'react-icons/bs';
import './Sidebar.css';

function Sidebar({ userRole }) {
  const getNavLinkClass = ({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link';

  // --- Student Links (Keep As Is) ---
  const studentLinks = (
    <>
      <NavLink to="/dashboard" className={getNavLinkClass} end> {/* Use 'end' for exact match */}
        <BsGridFill /> <span>Dashboard</span>
      </NavLink>
      <NavLink to="/attendance" className={getNavLinkClass}>
        <BsCalendarCheck /> <span>Attendance</span>
      </NavLink>
      <NavLink to="/notices" className={getNavLinkClass}>
        <BsBellFill /> <span>Notices</span>
      </NavLink>
      <NavLink to="/clubs" className={getNavLinkClass}>
        <BsPeopleFill /> <span>Clubs</span>
      </NavLink>
      <NavLink to="/profile" className={getNavLinkClass}>
        <BsPersonFill /> <span>Profile</span>
      </NavLink>
    </>
  );

  // --- ADD Club Links ---
  const clubLinks = (
    <>
      <NavLink to="/dashboard" className={getNavLinkClass} end>
        <BsGridFill /> <span>Club Dashboard</span>
      </NavLink>
      {/* Link to manage announcements */}
      <NavLink to="/club-announcements" className={getNavLinkClass}>
        <BsMegaphoneFill /> <span>Announcements</span>
      </NavLink>
      {/* Link to manage events */}
      <NavLink to="/club-events" className={getNavLinkClass}>
        <BsCalendarEventFill /> <span>Events</span>
      </NavLink>
       {/* Link to manage followers/members (optional) */}
      <NavLink to="/club-followers" className={getNavLinkClass}>
        <BsPeopleFill /> <span>Followers</span>
      </NavLink>
      {/* Link to edit club profile (optional) */}
       <NavLink to="/club-settings" className={getNavLinkClass}>
         <BsGearFill /> <span>Club Settings</span>
       </NavLink>
    </>
  );
 

   const facultyLinks = (
    <>
      <NavLink to="/dashboard" className={getNavLinkClass} end>
        <BsGridFill /> <span>Dashboard</span>
      </NavLink>
      <NavLink to="/notices" className={getNavLinkClass}>
        <BsBellFill /> <span>Campus Notices</span>
      </NavLink>
     <NavLink to="/my-clubs" className={getNavLinkClass}>
        <BsPeopleFill /> <span>My Coordinated Clubs</span>
      </NavLink>
      <NavLink to="/profile" className={getNavLinkClass}>
        <BsPersonFill /> <span>Profile</span>
      </NavLink>
    </>
    );

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        {/* Maybe show Club Name here if available? */}
        <h3>Campus360</h3>
      </div>
      <div className="sidebar-links">
        {userRole === 'student' && studentLinks}
        {userRole === 'club' && clubLinks} 
        {userRole === 'faculty' && facultyLinks}
      </div>
    </nav>
  );
}

export default Sidebar;