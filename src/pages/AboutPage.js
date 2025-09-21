import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaHeart, FaSmile, FaRocket } from "react-icons/fa";

function AboutPage() {
  const nav = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "#790707ff",
        fontFamily: "'Poppins', sans-serif",
        color: "#030303ff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative elements */}
      <div style={{
        position: "absolute",
        top: "10%",
        left: "5%",
        fontSize: "24px",
        animation: "float 6s ease-in-out infinite",
        color: "#060505ff",
      }}>✦</div>
      
      <div style={{
        position: "absolute",
        bottom: "15%",
        right: "7%",
        fontSize: "28px",
        animation: "float 4s ease-in-out infinite",
        animationDelay: "1s",
        color: "#080808ff",
      }}>❀</div>
      
      <div style={{
        position: "absolute",
        top: "20%",
        right: "10%",
        fontSize: "22px",
        animation: "float 5s ease-in-out infinite",
        animationDelay: "0.5s",
        color: "#ffc8dd",
      }}>★</div>

      {/* Back Button in upper left */}
      <button
        onClick={() => nav(-1)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#ebe0e0ff",
          color: "#010101ff",
          padding: "12px 20px 12px 16px",
          border: "none",
          borderRadius: "0 25px 25px 0",
          fontSize: "16px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 15px rgba(162, 210, 255, 0.3)",
          transition: "all 0.3s ease",
          position: "absolute",
          top: "30px",
          left: "0",
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(204, 100, 100, 0.9)";
          e.currentTarget.style.color = "white";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(9, 11, 12, 0.5)";
          e.currentTarget.style.transform = "translateX(4px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(204, 100, 100, 0.9)";
          e.currentTarget.style.color = "#f4ececff";
          e.currentTarget.style.boxShadow = "0 4px 15px rgba(5, 6, 7, 0.3)";
          e.currentTarget.style.transform = "translateX(0)";
        }}
      >
        <FaArrowLeft size={16} /> Back
      </button>

      {/* Card Container */}
      <div
        style={{
          maxWidth: "600px",
          width: "100%",
          background: "#dbb5bfff",
          borderRadius: "24px",
          padding: "40px 30px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.5)",
          transition: "transform 0.3s, box-shadow 0.3s",
          position: "relative",
          zIndex: 1,
          marginTop: "20px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-6px)";
          e.currentTarget.style.boxShadow = "0 15px 30px rgba(0,0,0,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)";
        }}
      >
        {/* Title with Icon */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          marginBottom: "25px",
          flexDirection: "column"
        }}>
          <div
            style={{
              fontSize: "42px",
              marginBottom: "10px",
              color: "#790707ff",
              animation: "bounce 2s infinite",
            }}
            aria-hidden="true"
          >
            <FaRocket />
          </div>
          <h1 style={{ 
            margin: 0, 
            fontSize: "32px", 
            fontWeight: 800, 
            letterSpacing: "0.5px",
            background: "linear-gradient(135deg, #d85372ff 0%, #4491d8ff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textAlign: "center"
          }}>
            About This App
          </h1>
        </div>

        {/* Description */}
        <div style={{
          background: "rgba(255, 240, 245, 0.7)",
          padding: "20px",
          borderRadius: "18px",
          marginBottom: "30px",
          border: "2px dashed #ffafcc"
        }}>
          <p
            style={{
              fontSize: "17px",
              lineHeight: "1.7",
              marginBottom: "0",
              color: "#131111ff",
              textAlign: "center",
            }}
          >
            This app is designed to help manage your system efficiently with a joyful experience! 
            It includes features like profile management, transaction history, and more to make 
            your digital life easier and more delightful. <FaSmile style={{ color: "#ffb703" }} />
          </p>
        </div>

        {/* Feature icons */}
        <div style={{
          display: "flex",
          justifyContent: "space-around",
          marginBottom: "30px"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #a2d2ff 0%, #bde0fe 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 10px",
              fontSize: "20px",
              color: "white"
            }}>👤</div>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Profiles</span>
          </div>
          
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ffafcc 0%, #ffc8dd 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 10px",
              fontSize: "20px",
              color: "white"
            }}>📊</div>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>History</span>
          </div>
          
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #504e52ff 0%, #e17ca3ff 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 10px",
              fontSize: "20px",
              color: "white"
            }}>⚙️</div>
            <span style={{ fontSize: "14px", fontWeight: 600, color:"#040101ff" }}>Settings</span>
          </div>
        </div>
        
        {/* Made with love */}
        <div style={{
          textAlign: "center",
          marginTop: "30px",
          fontSize: "14px",
          color: "#141313ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "5px"
        }}>
          Made with <FaHeart style={{ color: "#ec1e22ff" }} /> for you
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(5deg); }
          }
        `}
      </style>
    </div>
  );
}

export default AboutPage;