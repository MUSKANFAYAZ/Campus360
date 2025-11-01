import './FullScreenBgLayout.css'; 

function FullScreenBgLayout({ children }) {
  return (
    <div className="fullscreen-bg-layout">
      {children}
    </div>
  );
}

export default FullScreenBgLayout;