import Sidebar from './Sidebar'; 
import './Layout.css';

function Layout({ children, userRole }) {
  return (
    <div className="layout-container">
      <Sidebar userRole={userRole} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;