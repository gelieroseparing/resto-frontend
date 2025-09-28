import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaLock, FaUserCircle, FaTimes, FaCheck, FaCamera, FaArrowLeft } from "react-icons/fa";

export default function ProfilePage() {
  const { user, setUser, token } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username || "");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [msg, setMsg] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Create axios instance with baseURL
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {} 
  });

  // Debugging
  useEffect(() => {
    console.log("User object:", user);
    console.log("User profileImage:", user?.profileImage);
  }, [user]);

  const handleFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      
      // Create a preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const submit = async () => {
    if (!username) return setMsg("Username cannot be empty");
    
    setIsLoading(true);
    const data = new FormData();
    data.append("username", username);
    if (profileImage) data.append("profileImage", profileImage);
    
    try {
      const res = await api.put("/auth/profile", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setUser(res.data.user);
      setMsg("✅ Profile updated successfully!");
      setIsEditingUsername(false);
      setImagePreview(null); // Clear preview after successful upload
    } catch (e) {
      console.log("Profile update error:", e.response?.data);
      setMsg(e.response?.data?.message || "❌ Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMsg("❌ Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg("❌ New passwords do not match");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await api.put(
        "/auth/change-password",
        { currentPassword, newPassword }
      );
      console.log("Password change response:", res.data);
      setMsg(res.data.message || "✅ Password updated successfully!");
      setIsModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      console.log("Password change error:", e.response?.data);
      setMsg(e.response?.data?.message || "❌ Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  // Construct the image URL - Fixed version
  const getProfileImageUrl = () => {
    // If we have a new image selected, show preview
    if (imagePreview) {
      return imagePreview;
    }
    
    // If we have a profile image from the server
    if (user?.profileImage) {
      // Check if it's already a full URL
      if (user.profileImage.startsWith('http')) {
        return user.profileImage;
      }
      
      // Handle different backend response formats
      let imagePath = user.profileImage;
      
      // Remove any leading slash to avoid double slashes in URL
      if (imagePath.startsWith('/')) {
        imagePath = imagePath.substring(1);
      }
      
      // Use the same baseURL from axios instance
      return `${process.env.REACT_APP_API_URL}/${imagePath}`;
    }
    
    // Default profile image
    return "/profile.jpg";
  };

  return (
    <div style={{
      minHeight: "100vh", 
      background: "#790707ff", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      padding: 20, 
      fontFamily: "'Nunito', sans-serif",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative elements */}
      <div style={{
        position: "absolute",
        top: "-50px",
        left: "-50px",
        width: "200px",
        height: "200px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.2)",
        zIndex: 0
      }}></div>
      <div style={{
        position: "absolute",
        bottom: "-80px",
        right: "-80px",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.15)",
        zIndex: 0
      }}></div>
      
      <div style={{
        background: "#ca9a9aff", 
        padding: "40px 30px", 
        borderRadius: "24px", 
        maxWidth: "480px", 
        width: "100%", 
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)", 
        position: "relative",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.3)",
        zIndex: 1
      }}>
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            background: "rgba(255,182,193,0.2)",
            border: "none",
            color: "#161515ff",
            cursor: "pointer",
            padding: 10,
            borderRadius: "50%",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,182,193,0.4)";
            e.currentTarget.style.transform = "translateX(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,182,193,0.2)";
            e.currentTarget.style.transform = "translateX(0)";
          }}
          title="Go back"
        >
          <FaArrowLeft size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <h2 style={{ 
            margin: 0, 
            color: "#100f10ff", 
            fontSize: "28px", 
            fontWeight: "800",
            textShadow: "1px 1px 2px rgba(0,0,0,0.1)"
          }}>
            Profile Settings
          </h2>
          <p style={{ 
            color: "#3e3c3cff", 
            marginTop: 8, 
            fontSize: "14px",
            fontWeight: "500"
          }}>
            Manage your account information
          </p>
        </div>

        {/* Message */}
        {msg && (
          <div style={{ 
            padding: "12px 16px", 
            borderRadius: "12px", 
            marginBottom: 24, 
            backgroundColor: msg.includes("✅") ? "#d77272ff" : "rgba(254,226,226,0.7)",
            border: `1px solid ${msg.includes("✅") ? "#ce8484ff" : "#fecaca"}`,
            color: msg.includes("✅") ? "#181414ff" : "#dc2626",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 8,
            backdropFilter: "blur(5px)"
          }}>
            {msg.includes("✅") ? <FaCheck /> : <FaTimes />}
            {msg}
          </div>
        )}

        {/* Profile Image - Made larger as requested */}
        <div style={{ textAlign: "center", marginBottom: 30, position: "relative" }}>
          <div style={{
            position: "relative",
            display: "inline-block",
            borderRadius: "50%",
            padding: 8, // Increased padding to make the overall circle larger
            background: "linear-gradient(135deg, #ffb6c1 0%, #e75480 100%)",
            boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
          }}>
            <img
              src={getProfileImageUrl()}
              alt="Profile"
              onError={(e) => {
                // If image fails to load, show default
                e.target.src = "/profile.jpg";
              }}
              style={{
                width: 150, // Increased from 120 to 150
                height: 150, // Increased from 120 to 150
                borderRadius: "50%",
                objectFit: "cover",
                border: "5px solid #fff", // Slightly thicker border
                boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
              }}
            />
          </div>
          <label
            htmlFor="profileUpload"
            style={{
              position: "absolute",
              bottom: 12, // Adjusted position for larger image
              right: "calc(50% - 75px)", // Adjusted for larger image
              background: "#e75480",
              width: 40, // Slightly larger button
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              cursor: "pointer",
              boxShadow: "0 3px 10px rgba(231,84,128,0.4)",
              border: "2px solid #fff",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.background = "#ffb6c1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.background = "#e75480";
            }}
          >
            <FaCamera color="#fff" size={16} /> {/* Slightly larger icon */}
          </label>
          <input id="profileUpload" type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        </div>

        {/* Username */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: "block", 
            marginBottom: 8, 
            color: "#070607ff", 
            fontWeight: 700,
            fontSize: "14px",
            paddingLeft: "5px"
          }}>
            Username
          </label>
          <div style={{
            display: "flex",
            alignItems: "center",
            background: "#e3cacaff",
            borderRadius: "16px",
            padding: "14px 16px",
            border: "2px solid #ce8484ff",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
          }}>
            <FaUserCircle style={{ marginRight: 12, color: "#0f0a0bff", fontSize: 20 }} />
            {isEditingUsername ? (
              <input
                autoFocus
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 16,
                  background: "transparent",
                  color: "#0e0c0cff",
                  fontWeight: 500,
                  fontFamily: "'Nunito', sans-serif"
                }}
              />
            ) : (
              <span style={{ flex: 1, fontSize: 16, color: "#333", fontWeight: 600 }}>{username}</span>
            )}
            <button
              onClick={() => {
                if (isEditingUsername) {
                  submit();
                } else {
                  setIsEditingUsername(true);
                }
              }}
              style={{
                background: "rgba(217, 135, 139, 0.1)",
                border: "none",
                color: "#100d0eff",
                cursor: "pointer",
                padding: 8,
                borderRadius: "50%",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(231,84,128,0.2)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(231,84,128,0.1)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {isEditingUsername ? <FaCheck size={14} /> : <FaEdit size={14} />}
            </button>
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: 30 }}>
          <label style={{ 
            display: "block", 
            marginBottom: 8, 
            color: "#2b2828ff", 
            fontWeight: 700,
            fontSize: "14px",
            paddingLeft: "5px"
          }}>
            Password
          </label>
          <div style={{
            display: "flex",
            alignItems: "center",
            background: "#e3cacaff",
            borderRadius: "16px",
            padding: "14px 16px",
            border: "2px solid #ce8484ff",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
          }}>
            <FaLock style={{ marginRight: 12, color: "#171214ff", fontSize: 20 }} />
            <span style={{ flex: 1, color: "#120d0dff", fontWeight: 500 }}>••••••••</span>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: "rgba(231,84,128,0.1)",
                border: "none",
                color: "#070707ff",
                cursor: "pointer",
                padding: 8,
                borderRadius: "50%",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(231,84,128,0.2)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(231,84,128,0.1)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <FaEdit size={14} />
            </button>
          </div>
        </div>

        {/* User Position/Role */}
        {user?.position && (
          <div style={{ marginBottom: 30 }}>
            <label style={{ 
              display: "block", 
              marginBottom: 8, 
              color: "#050404ff", 
              fontWeight: 700,
              fontSize: "14px",
              paddingLeft: "5px"
            }}>
              Role
            </label>
            <div style={{
              display: "flex",
              alignItems: "center",
              background: "#e3cacaff",
              borderRadius: "16px",
              padding: "14px 16px",
              border: "2px solid #ce8484ff",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
            }}>
              <span style={{ 
                flex: 1, 
                color: "#060505ff", 
                fontWeight: 600,
                textTransform: "capitalize"
              }}>
                {user.position}
              </span>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={submit}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "16px",
            background: "#0e0b0bff",
            color: "#ff6b93",
            border: "none",
            borderRadius: "16px",
            fontSize: "16px",
            fontWeight: 700,
            cursor: isLoading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 10px rgba(231,84,128,0.3)",
            transition: "all 0.2s ease",
            opacity: isLoading ? 0.7 : 1,
            fontFamily: "'Nunito', sans-serif",
            letterSpacing: "0.5px"
          }}
          onMouseEnter={(e) => !isLoading && (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => !isLoading && (e.currentTarget.style.transform = "translateY(0)")}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>

        {/* Change Password Modal */}
        {isModalOpen && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: 20
          }}>
            <div style={{
              background: "#e3cacaff",
              padding: 30,
              borderRadius: "20px",
              width: "100%",
              maxWidth: 400,
              boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
              position: "relative",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)"
            }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  position: "absolute",
                  top: 15,
                  right: 15,
                  background: "rgba(231,84,128,0.1)",
                  border: "none",
                  color: "#e75480",
                  cursor: "pointer",
                  padding: 8,
                  borderRadius: "50%",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(231,84,128,0.2)";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
              >
                <FaTimes size={16} />
              </button>
              
              <h3 style={{ 
                marginBottom: 24, 
                textAlign: "center", 
                color: "#0d0c0cff",
                fontSize: "22px",
                fontWeight: "800",
                textShadow: "1px 1px 2px rgba(0,0,0,0.1)"
              }}>
                Change Password
              </h3>
              
              <div style={{ marginBottom: 20 }}>
                <input
                  type="password"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: "2px solid #e0b3b3ff",
                    fontSize: "16px",
                    transition: "all 0.2s ease",
                    background: "#e0b3b3ff",
                    fontFamily: "'Nunito', sans-serif",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#e75480";
                    e.currentTarget.style.background = "#e0b3b3ff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#f0f0f0";
                    e.currentTarget.style.background = "#e0b3b3ff";
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: "2px solid #e0b3b3ff",
                    fontSize: "16px",
                    transition: "all 0.2s ease",
                    background: "#e0b3b3ff",
                    fontFamily: "'Nunito', sans-serif",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#e75480";
                    e.currentTarget.style.background = "#e0b3b3ff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#f0f0f0";
                    e.currentTarget.style.background = "#e0b3b3ff";
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: "2px solid #e0b3b3ff",
                    fontSize: "16px",
                    transition: "all 0.2s ease",
                    background: "#e0b3b3ff",
                    fontFamily: "'Nunito', sans-serif",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#e75480";
                    e.currentTarget.style.background = "#e0b3b3ff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#f0f0f0";
                    e.currentTarget.style.background = "#e0b3b3ff";
                  }}
                />
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "14px",
                    border: "2px solid #f0f0f0",
                    borderRadius: "12px",
                    background: "#010000ff",
                    color: "#ff6b93",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                    fontFamily: "'Nunito', sans-serif",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#020101ff";
                    e.currentTarget.style.borderColor = "#e75480";
                    e.currentTarget.style.color = "#e75480";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: "14px",
                    border: "2px solid #f0f0f0",
                    borderRadius: "12px",
                    background:  "#010000ff",
                    color: "#ff6b93",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                    opacity: isLoading ? 0.7 : 1,
                    fontFamily: "'Nunito', sans-serif",
                    boxShadow: "0 3px 8px rgba(231,84,128,0.3)"
                  }}
                  onMouseEnter={(e) => !isLoading && (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={(e) => !isLoading && (e.currentTarget.style.transform = "translateY(0)")}
                >
                  {isLoading ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}