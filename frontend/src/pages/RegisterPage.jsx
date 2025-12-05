import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import FacebookLogin from '@greatsumini/react-facebook-login';
import "./RegisterPage.css"; 
import PasswordInput from "../components/PasswordInput";
import { BsFacebook } from 'react-icons/bs';

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("/api/auth/send-otp", { name, email, password });
      console.log(res.data);

      setSuccess(res.data.msg || "OTP Sent! Redirecting to verification...");

      //Navigate to the verification page, passing the email in the state
      navigate("/verify-email", { state: { email: email } });

    } catch (err) {
      setError(
        err.response?.data?.msg || "Registration failed. Please try again."
      );
      console.error("Registration error:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/google-login", {
        token: credentialResponse.credential,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userName", res.data.name);
      localStorage.setItem("userRole", res.data.role);
      localStorage.setItem("userId", res.data.userId);
      navigate("/dashboard");
    } catch (err) {
      setError("Google sign-up failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-up failed. Please try again.");
  };


  const handleFacebookSuccess = async (response) => {
    setLoading(true);
    try {
      // Send the accessToken and userId to backend
      const res = await axios.post("/api/auth/facebook-login", {
        userId: response.userID,
        accessToken: response.accessToken
      });
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userName", res.data.name);
      localStorage.setItem("userRole", res.data.role);
      localStorage.setItem("userId", res.data.userId);
      navigate("/dashboard");
    } catch (err) {
      setError("Facebook login failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  if (!googleClientId) {
    return <div>Error: Google Client ID not configured. Check .env file.</div>;
  }
   if (!facebookAppId) {
    return <div>Error: Facebook App ID not configured. Check .env file.</div>;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="register-container">
        <form className="register-form" onSubmit={handleSubmit}> 
          <h2>Create Account</h2>

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text" id="name" value={name}
              onChange={(e) => setName(e.target.value)}
              required disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email" id="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              required disabled={loading}
            />
          </div>

          <PasswordInput
            label="Password" id="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={true} disabled={loading}
          />

          <PasswordInput
            label="Confirm Password" id="confirmPassword" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required={true} disabled={loading}
          />

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

        
          <button type="submit" className="register-button" disabled={loading}>
            {loading ? "Sending OTP..." : "Register"}
          </button>
          

          <div className="divider">OR</div>
          
          <div className="social-login">
            
            <div className="google-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                  theme="outline"
                  size="large"
                />
            </div>

            {facebookAppId && (
              <FacebookLogin
                appId={facebookAppId}
                onSuccess={(response) => {
                    console.log("FB Success:", response);
                    handleFacebookSuccess(response); 
                }}
                onFail={(error) => {
                    console.log("FB Failed:", error);
                    setError("Facebook Login Failed");
                }}
                render={({ onClick }) => (
                  <button
                    className="btn-social"
                    type="button"
                    color="white"
                    onClick={onClick}
                  >
                    <BsFacebook />
                    <span>Sign in with Facebook</span>
                  </button>
                )}
              />
            )}
          </div>

          <div className="login-link">
            <p>
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </div>
        </form>
      </div>
    </GoogleOAuthProvider>
  );
}

export default RegisterPage;