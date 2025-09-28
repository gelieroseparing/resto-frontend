import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';

export default function HistoryTransaction() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchDate, setSearchDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('all'); // 'all', '3days', '7days', '30days'
  const navigate = useNavigate();

  // Create axios instance with baseURL - use useCallback to prevent recreation
  const api = useCallback(() => axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {} 
  }), [token]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Fetching orders from:', `${process.env.REACT_APP_API_URL}/orders`);
        
        const response = await api().get('/orders');
        console.log('Orders response:', response.data);
        
        // Handle different response structures
        if (response.data && Array.isArray(response.data.orders)) {
          setOrders(response.data.orders);
        } else if (Array.isArray(response.data)) {
          setOrders(response.data);
        } else {
          console.error('Unexpected response format:', response.data);
          setError('Unexpected data format received');
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        console.error('Error details:', err.response?.data);
        
        if (err.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response?.status === 404) {
          setError('Orders endpoint not found. Check backend connection.');
        } else {
          setError('Failed to load orders: ' + (err.response?.data?.message || err.message));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [api]); // Only depend on api function

  // Filter orders by date range
  const filterOrdersByDateRange = useCallback((ordersArray, range) => {
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case '3days':
        startDate.setDate(now.getDate() - 3);
        break;
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'all':
      default:
        return ordersArray;
    }

    return ordersArray.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= now;
    });
  }, []);

  // Get orders based on date range filter
  const getFilteredOrdersByRange = useCallback(() => {
    if (dateRange === 'all') {
      return orders;
    }
    return filterOrdersByDateRange(orders, dateRange);
  }, [orders, dateRange, filterOrdersByDateRange]);

  // Extract unique dates from filtered orders
  const uniqueDates = Array.from(
    new Set(
      getFilteredOrdersByRange().map(o => o.createdAt ? new Date(o.createdAt).toDateString() : 'Unknown Date')
    )
  ).sort((a, b) => new Date(b) - new Date(a));

  // Filter orders based on selected date or search date
  const filteredOrders = selectedDate
    ? getFilteredOrdersByRange().filter(o => o.createdAt && new Date(o.createdAt).toDateString() === selectedDate)
    : searchDate
      ? getFilteredOrdersByRange().filter(o => o.createdAt && new Date(o.createdAt).toDateString() === new Date(searchDate).toDateString())
      : getFilteredOrdersByRange();

  // Safe amount formatting
  const formatAmount = (amount) => {
    return amount ? parseFloat(amount).toFixed(2) : '0.00';
  };

  // Get order count for date range
  const getOrderCountForRange = (range) => {
    return filterOrdersByDateRange(orders, range).length;
  };

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
        fontSize: "24px",
        background: "rgba(255,255,255,0.1)",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease"
      }} 
      onClick={() => navigate('/settingpage')}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.2)";
        e.currentTarget.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
        e.currentTarget.style.transform = "scale(1)";
      }}>
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

      {/* Loading and Error States */}
      {loading && (
        <div style={{
          textAlign: "center",
          color: "#efeff1ff",
          fontSize: "18px",
          marginBottom: "20px"
        }}>
          Loading orders...
        </div>
      )}

      {error && (
        <div style={{
          background: "#ffcccc",
          color: "#d63031",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "20px",
          textAlign: "center",
          border: "1px solid #ff6b6b"
        }}>
          {error}
        </div>
      )}

      {/* Date Range Filter */}
      {!loading && !error && orders.length > 0 && (
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <h3 style={{ marginBottom: "10px", color: "#efeff1ff" }}>Date Range</h3>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px" }}>
            {[
              { value: 'all', label: 'All Time', count: orders.length },
              { value: '3days', label: 'Last 3 Days', count: getOrderCountForRange('3days') },
              { value: '7days', label: 'Last 7 Days', count: getOrderCountForRange('7days') },
              { value: '30days', label: 'Last 30 Days', count: getOrderCountForRange('30days') }
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => {
                  setDateRange(range.value);
                  setSelectedDate(null);
                  setSearchDate('');
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: dateRange === range.value ? "#ff6b93" : "#e0f2fe",
                  color: dateRange === range.value ? "#fff" : "#0c4a6e",
                  cursor: "pointer",
                  fontWeight: "bold",
                  transition: "all 0.2s ease",
                  fontSize: "14px",
                  minWidth: "120px"
                }}
                onMouseEnter={(e) => {
                  if (dateRange !== range.value) {
                    e.currentTarget.style.background = "#bae6fd";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (dateRange !== range.value) {
                    e.currentTarget.style.background = "#e0f2fe";
                    e.currentTarget.style.transform = "scale(1)";
                  }
                }}
              >
                {range.label} ({range.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Date Input */}
      <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <label htmlFor="searchDate" style={{ marginBottom: "8px", color: "#efeff1ff", fontWeight: "bold" }}>Search by Specific Date:</label>
        <input
          type="date"
          id="searchDate"
          value={searchDate}
          onChange={(e) => {
            setSearchDate(e.target.value);
            setSelectedDate(null);
            setDateRange('all');
          }}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "2px solid #ca9a9aff",
            width: "200px",
            background: "#fff",
            fontSize: "14px"
          }}
        />
        {searchDate && (
          <button
            onClick={() => {
              setSearchDate('');
            }}
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              border: "none",
              backgroundColor: "#0284c7",
              color: "#fff",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#0369a1";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#0284c7";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Date selection buttons */}
      {!loading && !error && getFilteredOrdersByRange().length > 0 && (
        <div style={{ marginBottom: "30px", textAlign: "center" }}>
          <h3 style={{ marginBottom: "10px", color: "#efeff1ff" }}>Select a Specific Date</h3>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px" }}>
            {/* All Button */}
            <button
              onClick={() => {
                setSelectedDate(null);
                setSearchDate('');
              }}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: selectedDate === null ? "#ff6b93" : "#e0f2fe",
                color: selectedDate === null ? "#fff" : "#0c4a6e",
                cursor: "pointer",
                fontWeight: "bold",
                transition: "all 0.2s ease",
                fontSize: "14px"
              }}
              onMouseEnter={(e) => {
                if (selectedDate !== null) {
                  e.currentTarget.style.background = "#bae6fd";
                  e.currentTarget.style.transform = "scale(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedDate !== null) {
                  e.currentTarget.style.background = "#e0f2fe";
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              All ({getFilteredOrdersByRange().length})
            </button>
            {/* Date Buttons */}
            {uniqueDates.map((dateStr) => {
              const dateOrders = getFilteredOrdersByRange().filter(o => o.createdAt && new Date(o.createdAt).toDateString() === dateStr);
              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setSearchDate('');
                  }}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: selectedDate === dateStr ? "#ff6b93" : "#e0f2fe",
                    color: selectedDate === dateStr ? "#fff" : "#0c4a6e",
                    cursor: "pointer",
                    fontWeight: "bold",
                    transition: "all 0.2s ease",
                    fontSize: "14px"
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDate !== dateStr) {
                      e.currentTarget.style.background = "#bae6fd";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDate !== dateStr) {
                      e.currentTarget.style.background = "#e0f2fe";
                      e.currentTarget.style.transform = "scale(1)";
                    }
                  }}
                >
                  {dateStr} ({dateOrders.length})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Orders list */}
      {!loading && !error && filteredOrders.length === 0 ? (
        <div style={{
          textAlign: "center",
          color: "#efeff1ff",
          fontSize: "18px",
          background: "rgba(255,255,255,0.1)",
          padding: "40px 20px",
          borderRadius: "12px",
          marginTop: "20px"
        }}>
          {getFilteredOrdersByRange().length === 0 ? 'No orders found for selected date range.' : 'No orders found for this specific date.'}
        </div>
      ) : (
        !loading && !error && (
          <div style={{
            display: "grid",
            gap: "20px",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          }}>
            {filteredOrders.map((o) => (
              <div key={o._id} style={{
                background: "#ca9a9aff",
                borderRadius: "15px",
                padding: "20px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "transform 0.2s, box-shadow 0.2s",
                border: "2px solid #a12743ff"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}>
                {/* Order Header */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}>
                  <div style={{ fontWeight: 600, color: "#111827", fontSize: "16px" }}>
                    Order #{o._id?.slice(-6) || 'N/A'}
                  </div>
                  <div style={{ fontSize: "14px", color: "#374151" }}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : 'Unknown date'}
                  </div>
                </div>
                
                {/* Order Details */}
                <div style={{ marginBottom: "12px", color: "#1f2937", fontSize: "14px" }}>
                  <div><strong>Type:</strong> {o.orderType || 'N/A'}</div>
                  <div><strong>Cashier:</strong> {o.createdBy || user?.username || 'Unknown'}</div>
                  {o.paymentMethod && <div><strong>Payment:</strong> {o.paymentMethod}</div>}
                </div>
                
                {/* Items */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1f2937", marginBottom: "6px" }}>
                    Items:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    {o.items && o.items.length > 0 ? (
                      o.items.map((it, i) => (
                        <li key={i} style={{ marginBottom: "6px", fontSize: "14px", color: "#374151" }}>
                          {it.name} × {it.quantity} — ₱{formatAmount((it.price || 0) * (it.quantity || 0))}
                        </li>
                      ))
                    ) : (
                      <li style={{ color: "#6b7280", fontStyle: "italic" }}>No items</li>
                    )}
                  </ul>
                </div>
                
                {/* Additional Payments */}
                {o.additionalPayments && o.additionalPayments.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1f2937", marginBottom: "6px" }}>
                      Additional Payments:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      {o.additionalPayments.map((payment, i) => (
                        <li key={i} style={{ marginBottom: "4px", fontSize: "14px", color: "#374151" }}>
                          {payment.description} — ₱{formatAmount(payment.amount)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Total */}
                <div style={{
                  textAlign: "right",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#111827",
                  borderTop: "2px solid #a12743ff",
                  paddingTop: "12px",
                  marginTop: "12px"
                }}>
                  Total: ₱{formatAmount(o.totalAmount)}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}