import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';

export default function HistoryTransaction() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchDate, setSearchDate] = useState('');
  const navigate = useNavigate();

  // Create axios instance with baseURL
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {} 
  });

  useEffect(() => {
    api.get('/orders')
      .then(r => setOrders(r.data))
      .catch(e => console.error('Failed to fetch orders:', e));
  }, [api]);

  // Extract unique dates from orders
  const uniqueDates = Array.from(
    new Set(
      orders.map(o => new Date(o.createdAt).toDateString())
    )
  ).sort((a, b) => new Date(b) - new Date(a));

  // Filter orders based on selected date or search date
  const filteredOrders = selectedDate
    ? orders.filter(o => new Date(o.createdAt).toDateString() === selectedDate)
    : searchDate
      ? orders.filter(o => new Date(o.createdAt).toDateString() === new Date(searchDate).toDateString())
      : orders;

  return (
    <div style={{
      padding: "40px 20px",
      background: "#790707ff",
      minHeight: "100vh",
      fontFamily: "'Poppins', sans-serif",
      position: "relative"
    }}>
      {/* Back Button Icon */}
      <div style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        color: "#efeff1ff",
        cursor: "pointer",
        fontSize: "24px"
      }} onClick={() => navigate('/settingpage')}>
        &#8592;
      </div>

      {/* Title and Search Bar */}
      <h2 style={{
        textAlign: "center",
        marginBottom: "20px",
        color: "#f0f1f4ff",
        fontSize: "28px",
        fontWeight: 600,
      }}>Order History</h2>

      {/* Search Date Input */}
      <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <label htmlFor="searchDate" style={{ marginBottom: "8px", color: "#efeff1ff", fontWeight: "bold" }}>Search by Date:</label>
        <input
          type="date"
          id="searchDate"
          value={searchDate}
          onChange={(e) => {
            setSearchDate(e.target.value);
            setSelectedDate(null);
          }}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            width: "200px"
          }}
        />
        {searchDate && (
          <button
            onClick={() => {
              setSearchDate('');
            }}
            style={{
              marginTop: "10px",
              padding: "6px 12px",
              border: "none",
              backgroundColor: "#0284c7",
              color: "#ca9a9aff",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Date selection buttons */}
      <div style={{ marginBottom: "30px", textAlign: "center" }}>
        <h3 style={{ marginBottom: "10px", color: "#efeff1ff" }}>Select a Date</h3>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
          {/* All Button */}
          <button
            onClick={() => {
              setSelectedDate(null);
              setSearchDate('');
            }}
            style={{
              margin: "5px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: selectedDate === null ? "#ff6b93" : "#e0f2fe",
              color: selectedDate === null ? "#fff" : "#0c0f10ff",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            All
          </button>
          {/* Date Buttons */}
          {uniqueDates.map((dateStr) => (
            <button
              key={dateStr}
              onClick={() => {
                setSelectedDate(dateStr);
                setSearchDate('');
              }}
              style={{
                margin: "5px",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: selectedDate === dateStr ? "#ff6b93" : "#e0f2fe",
                color: selectedDate === dateStr ? "#f4f0f0ff" : "#010101ff",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {dateStr}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <p style={{
          textAlign: "center",
          color: "#6b7280",
          fontSize: "18px",
        }}>No orders found for this date.</p>
      ) : (
        <div style={{
          display: "grid",
          gap: "20px",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
        }}>
          {filteredOrders.map((o) => (
            <div key={o._id} style={{
              background: "#c4a2a2ff",
              borderRadius: "15px",
              padding: "20px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
            }}>
              {/* Order Header */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}>
                <div style={{ fontWeight: 600, color: "#111827" }}>
                  Order #{o._id?.slice(-6) || 'N/A'} • {new Date(o.createdAt).toLocaleString()}
                </div>
              </div>
              {/* Order Details */}
              <div style={{ marginBottom: "12px", color: "#050507ff", fontSize: "14px" }}>
                Type: {o.orderType} &nbsp;•&nbsp; By: {o.createdBy || user?.username || 'Unknown'}
              </div>
              {/* Items */}
              <ul style={{ margin: 0, paddingLeft: "20px", marginBottom: "12px" }}>
                {o.items && o.items.length > 0 ? (
                  o.items.map((it, i) => (
                    <li key={i} style={{ marginBottom: "6px", fontSize: "14px", color: "#07080aff" }}>
                      {it.name} × {it.quantity} — ₱{((it.price || 0) * (it.quantity || 0)).toFixed(2)}
                    </li>
                  ))
                ) : (
                  <li>No items</li>
                )}
              </ul>
              
              {/* Additional Payments */}
              {o.additionalPayments && o.additionalPayments.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#07080aff", marginBottom: "6px" }}>
                    Additional Payments:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    {o.additionalPayments.map((payment, i) => (
                      <li key={i} style={{ marginBottom: "4px", fontSize: "14px", color: "#07080aff" }}>
                        {payment.description} — ₱{(payment.amount || 0).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Total */}
              <div style={{
                textAlign: "right",
                fontSize: "16px",
                fontWeight: 600,
                color: "#111827",
              }}>Total: ₱{(o.totalAmount || 0).toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}