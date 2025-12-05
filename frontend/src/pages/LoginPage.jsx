import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import FacebookLogin from '@greatsumini/react-facebook-login';
import "./RegisterPage.css";
import { BsFacebook } from 'react-icons/bs';
import PasswordInput from "../components/PasswordInput";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
 
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/api/auth/login", { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userName", res.data.name);
      localStorage.setItem("userRole", res.data.role);
      localStorage.setItem("userId", res.data.userId);

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed. Check credentials.");
      console.error("Login error:", err);
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
      setError("Google login failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please try again.");
  };

  const handleFacebookSuccess = async (response) => {
    setLoading(true);
    try {
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

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="register-container">
        {" "}
        <form className="register-form" onSubmit={handleLogin}>
          {" "}

          <h2>Login</h2>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <PasswordInput
            label="Password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={true}
            disabled={loading}
          />
          <div style={{ textAlign: "right", marginBottom: "1rem" }}>
            <Link
              to="/forgot-password"
              style={{ fontSize: "0.9rem", color: "#007bff" }}
            >
              Forgot Password?
            </Link>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="register-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          <div className="divider">OR</div>
          <div className="social-login" style={{ marginBottom: "1.5rem" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
            />

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
              Don't have an account? <Link to="/register">Register here</Link>
            </p>
          </div>
        </form>
      </div>
    </GoogleOAuthProvider>
  );
}

export default LoginPage;
