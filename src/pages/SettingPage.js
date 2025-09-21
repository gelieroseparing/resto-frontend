import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaUser, FaPlus, FaHistory, FaInfoCircle, FaSignOutAlt, FaChevronRight } from "react-icons/fa";

function SettingsPage() {
  const nav = useNavigate();
  const [activeButton, setActiveButton] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    nav("/");
  };

  const handleButtonInteraction = (index, isActive) => {
    setActiveButton(isActive ? index : null);
  };

  const menuItems = [
    { label: "Profile", path: "/profile", icon: <FaUser />, color: "#3b82f6" },
    { label: "Add Item", path: "/add", icon: <FaPlus />, color: "#f59e0b" },
    { label: "History", path: "/history", icon: <FaHistory />, color: "#10b981" },
    { label: "About", path: "/about", icon: <FaInfoCircle />, color: "#8b5cf6" },
    { label: "Logout", onClick: handleLogout, icon: <FaSignOutAlt />, color: "#ef4444" },
  ];

  return (
    <div
      style={{
        padding: "20px",
        background: "#790707ff",
        minHeight: "100vh",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "30px",
          padding: "10px 0",
        }}
      >
        <button
          onClick={() => nav("/home")}
          style={{
            background: "#e0b7b7ff",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            color: "#790707ff",
            padding: "10px",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateX(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateX(0)";
            e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
          }}
        >
          <FaArrowLeft />
        </button>
        <h1 style={{ 
          marginLeft: "15px", 
          fontSize: "28px", 
          fontWeight: "700",
          color: "#eef1f7ff",
        }}>
          Settings
        </h1>
      </div>

      {/* Menu Options */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "500px",
          margin: "0 auto",
        }}
      >
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick || (() => nav(item.path))}
            onMouseDown={() => handleButtonInteraction(index, true)}
            onMouseUp={() => handleButtonInteraction(index, false)}
            style={{
              background: activeButton === index ? "#e2d8d8ff" : "#ebe0e0ff",
              border: "none",
              borderRadius: "14px",
              padding: "16px 20px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              transition: "all 0.2s ease",
              color: "#374151",
              transform: activeButton === index ? "scale(0.98)" : "scale(1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.1)";
              e.currentTarget.style.background = "#f9fafb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
              e.currentTarget.style.background = "#fff";
              handleButtonInteraction(index, false);
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  background: item.color + "20",
                  color: item.color,
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                }}
              >
                {item.icon}
              </div>
              <span>{item.label}</span>
            </div>
            <span style={{ 
              fontSize: "14px", 
              color: "#6b7280",
            }}>
              <FaChevronRight />
            </span>
          </button>
        ))}
      </div>

      {/* App Version */}
      <div style={{
        textAlign: "center",
        marginTop: "40px",
        color: "#6b7280",
        fontSize: "14px",
      }}>
      
      </div>
    </div>
  );
}

export default SettingsPage;