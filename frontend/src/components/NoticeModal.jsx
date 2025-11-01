import React, { useState } from 'react';
import axios from 'axios';
import './NoticeModal.css'; 

// Define categories matching your backend model
const categories = ['General', 'Academic', 'Event', 'Club Activity', 'Lost & Found', 'Sports', 'Urgent', 'Other'];
const audiences = ['All', 'Students', 'Faculty']; // Keep simple for now

function NoticeModal({ isOpen, onClose, onNoticeCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [audience, setAudience] = useState('All');
  const [expiresAt, setExpiresAt] = useState(''); // Store as string 'YYYY-MM-DD'
  const [isPinned, setIsPinned] = useState(false);
  // const [attachments, setAttachments] = useState([]); // State for file uploads (complex)
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
      expiresAt: expiresAt || null, // Send null if empty
      isPinned,
      // attachments: [], // Send attachment data later
    };

    try {
      if (!token) throw new Error("Authentication error.");
      const res = await axios.post('/api/notices', noticeData, authHeader);
      onNoticeCreated(res.data); // Pass the newly created notice back
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
          {/* Title */}
          <div className="form-group">
            <label htmlFor="noticeTitle">Title</label>
            <input
              type="text" id="noticeTitle" value={title}
              onChange={(e) => setTitle(e.target.value)} required
            />
          </div>

          {/* Content */}
          <div className="form-group">
            <label htmlFor="noticeContent">Content</label>
            <textarea
              id="noticeContent" value={content}
              onChange={(e) => setContent(e.target.value)} required rows={5}
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="noticeCategory">Category</label>
            <select id="noticeCategory" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Audience */}
          <div className="form-group">
            <label htmlFor="noticeAudience">Audience</label>
            <select id="noticeAudience" value={audience} onChange={(e) => setAudience(e.target.value)}>
              {audiences.map(aud => <option key={aud} value={aud}>{aud}</option>)}
            </select>
          </div>

          {/* Expires At */}
          <div className="form-group">
            <label htmlFor="noticeExpiresAt">Expires At (Optional)</label>
            <input
              type="date" id="noticeExpiresAt" value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              // Optional: Add min attribute to prevent past dates
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

           {/* Pinned */}
           <div className="form-group checkbox-group">
             <input
               type="checkbox" id="noticeIsPinned" checked={isPinned}
               onChange={(e) => setIsPinned(e.target.checked)}
             />
            <label htmlFor="noticeIsPinned">Pin this notice (Keep at top)</label>
          </div>

          {/* Attachments Placeholder */}
          {/* <div className="form-group">
            <label>Attachments (Coming Soon)</label>
            <input type="file" multiple disabled />
          </div> */}

          {error && <p className="error-message">{error}</p>}

          {/* Actions */}
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