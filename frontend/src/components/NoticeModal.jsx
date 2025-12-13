import React, { useState } from 'react';
import axios from 'axios';
import './NoticeModal.css'; 
import './DashboardContent.css'; 

const categories = ['General', 'Academic', 'Event', 'Club Activity', 'Lost & Found', 'Sports', 'Urgent', 'Other'];
const audiences = ['All', 'Students', 'Faculty']; 

function NoticeModal({ isOpen, onClose, onNoticeCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [audience, setAudience] = useState('All');
  const [expiresAt, setExpiresAt] = useState(''); 
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem('token');
  const authHeader = { headers: { 'x-auth-token': token } };

  const resetForm = () => {
      setTitle('');
      setContent('');
      setCategory('General');
      setAudience('All');
      setExpiresAt('');
      setIsPinned(false);
      setError('');
      setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!title || !content) {
      setError('Title and content are required.');
      setIsLoading(false);
      return;
    }

    const noticeData = {
      title,
      content,
      category,
      audience,
      expiresAt: expiresAt || null, 
      attachments: [], 
    };

    try {
      if (!token) throw new Error("Authentication error.");
      const res = await axios.post('/api/notices', noticeData, authHeader);
      
      onNoticeCreated(res.data); 
      resetForm();
      onClose(); 
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create notice. Please try again.');
      console.error("Error creating notice:", err.response?.data || err);
    } finally {
        setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content widget-card"> 
        <h2>Create New Notice</h2>
        <form onSubmit={handleSubmit}>
       
          <div className="form-group">
            <label htmlFor="noticeTitle">Title</label>
            <input
              type="text" id="noticeTitle" value={title}
              onChange={(e) => setTitle(e.target.value)} required
            />
          </div>

          <div className="form-group">
            <label htmlFor="noticeContent">Content</label>
            <textarea
              id="noticeContent" value={content}
              onChange={(e) => setContent(e.target.value)} required rows={5}
            />
          </div>
     
          <div className="form-group">
            <label htmlFor="noticeCategory">Category</label>
            <select id="noticeCategory" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
     
          <div className="form-group">
            <label htmlFor="noticeAudience">Audience</label>
            <select id="noticeAudience" value={audience} onChange={(e) => setAudience(e.target.value)}>
              {audiences.map(aud => <option key={aud} value={aud}>{aud}</option>)}
            </select>
          </div>
        
          <div className="form-group">
            <label htmlFor="noticeExpiresAt">Expires At (Optional)</label>
            <input
              type="date" id="noticeExpiresAt" value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split("T")[0]} // Prevent past dates
            />
          </div>

           <div className="form-group checkbox-group">
             <input
               type="checkbox" id="noticeIsPinned" checked={isPinned}
               onChange={(e) => setIsPinned(e.target.checked)}
             />
            <label htmlFor="noticeIsPinned">Pin this notice (Keep at top)</label>
          </div>

          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={() => { resetForm(); onClose(); }} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="register-button" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NoticeModal;