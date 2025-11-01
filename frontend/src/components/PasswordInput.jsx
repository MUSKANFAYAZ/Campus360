import React, { useState } from 'react';
import './PasswordInput.css';
import { BsEyeFill, BsEyeSlashFill } from 'react-icons/bs';

function PasswordInput({ label, id, value, onChange, required = false }) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrapper">
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          value={value}
          onChange={onChange}
          required={required}
        />
        <button
          type="button"
          className="password-toggle-btn"
          onClick={toggleVisibility}
        >
          {/* 2. Use the new icon components */}
          {showPassword ? <BsEyeSlashFill /> : <BsEyeFill />}
        </button>
      </div>
    </div>
  );
}

export default PasswordInput;