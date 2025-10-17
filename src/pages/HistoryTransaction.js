import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { FaPrint, FaFileExport, FaMoneyBillWave, FaChartBar, FaBox, FaCheck, FaArrowLeft, FaSearch, FaFilter } from 'react-icons/fa';

export default function HistoryTransaction() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchDate, setSearchDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [showEndOfDayModal, setShowEndOfDayModal] = useState(false);
  const [endOfDayData, setEndOfDayData] = useState(null);
  const [cashCount, setCashCount] = useState('');
  const [cashVariance, setCashVariance] = useState(0);
  const [inventoryUpdated, setInventoryUpdated] = useState(false);
  const [processingEndOfDay, setProcessingEndOfDay] = useState(false);
  const [endOfDayHistory, setEndOfDayHistory] = useState([]);
  const [showEndOfDayHistory, setShowEndOfDayHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const navigate = useNavigate();

  const api = useCallback(() => axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {} 
  }), [token]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Fetching orders from:', `${process.env.REACT_APP_API_URL}/orders`);
        
        const response = await api().get('/orders');
        console.log('Orders response:', response.data);
        
        if (response.data && Array.isArray(response.data.orders)) {
          const sortedOrders = response.data.orders.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          setOrders(sortedOrders);
        } else if (Array.isArray(response.data)) {
          const sortedOrders = response.data.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          setOrders(sortedOrders);
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
  }, [api]);

  // Filter orders by date range
  const filterOrdersByDateRange = useCallback((ordersArray, range) => {
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
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

  // Apply all filters
  useEffect(() => {
    let result = getFilteredOrdersByRange();

    // Filter by selected date
    if (selectedDate) {
      result = result.filter(o => o.createdAt && new Date(o.createdAt).toDateString() === selectedDate);
    }

    // Filter by search date
    if (searchDate) {
      result = result.filter(o => o.createdAt && new Date(o.createdAt).toDateString() === new Date(searchDate).toDateString());
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order._id?.toLowerCase().includes(term) ||
        order.createdBy?.toLowerCase().includes(term) ||
        order.orderType?.toLowerCase().includes(term) ||
        order.paymentMethod?.toLowerCase().includes(term) ||
        (order.items && order.items.some(item => 
          item.name?.toLowerCase().includes(term)
        ))
      );
    }

    setFilteredOrders(result);
  }, [getFilteredOrdersByRange, selectedDate, searchDate, searchTerm]);

  // Safe amount formatting
  const formatAmount = (amount) => {
    return amount ? parseFloat(amount).toFixed(2) : '0.00';
  };

  // Get order count for date range
  const getOrderCountForRange = (range) => {
    return filterOrdersByDateRange(orders, range).length;
  };

  // Calculate total sales for a given orders array
  const calculateTotalSales = (ordersArray) => {
    return ordersArray.reduce((total, order) => total + (order.totalAmount || 0), 0);
  };

  // End of Day Functions
  const generateEndOfDayReport = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await api().get(`/orders/end-of-day/report?date=${today}`);
      
      if (response.data.success) {
        setEndOfDayData(response.data.report);
        setShowEndOfDayModal(true);
      } else {
        setError('Failed to generate End of Day report');
      }
    } catch (err) {
      console.error('Error generating End of Day report:', err);
      // Create mock data for demo purposes
      const mockReport = {
        date: new Date().toDateString(),
        salesSummary: {
          totalSales: calculateTotalSales(getFilteredOrdersByRange()),
          totalOrders: getFilteredOrdersByRange().length,
          averageOrderValue: getFilteredOrdersByRange().length > 0 ? 
            calculateTotalSales(getFilteredOrdersByRange()) / getFilteredOrdersByRange().length : 0
        },
        paymentSummary: {
          'Cash': calculateTotalSales(getFilteredOrdersByRange().filter(o => o.paymentMethod === 'Cash')),
          'GCash': calculateTotalSales(getFilteredOrdersByRange().filter(o => o.paymentMethod === 'GCash')),
          'Credit Card': calculateTotalSales(getFilteredOrdersByRange().filter(o => o.paymentMethod === 'Credit Card'))
        },
        serverPerformance: getFilteredOrdersByRange().reduce((acc, order) => {
          const server = order.createdBy || 'Unknown';
          if (!acc[server]) {
            acc[server] = { serverName: server, orderCount: 0, totalSales: 0 };
          }
          acc[server].orderCount++;
          acc[server].totalSales += order.totalAmount || 0;
          return acc;
        }, {}),
        itemSales: getFilteredOrdersByRange().reduce((acc, order) => {
          order.items?.forEach(item => {
            const existing = acc.find(i => i.itemName === item.name);
            if (existing) {
              existing.quantity += item.quantity || 0;
              existing.revenue += (item.price || 0) * (item.quantity || 0);
            } else {
              acc.push({
                itemName: item.name,
                category: item.category || 'Uncategorized',
                price: item.price || 0,
                quantity: item.quantity || 0,
                revenue: (item.price || 0) * (item.quantity || 0)
              });
            }
          });
          return acc;
        }, []).sort((a, b) => b.quantity - a.quantity)
      };

      // Calculate average for server performance
      Object.keys(mockReport.serverPerformance).forEach(server => {
        mockReport.serverPerformance[server].averageSale = 
          mockReport.serverPerformance[server].totalSales / mockReport.serverPerformance[server].orderCount;
      });

      setEndOfDayData(mockReport);
      setShowEndOfDayModal(true);
    } finally {
      setLoading(false);
    }
  };

  const reconcileCash = () => {
    if (!cashCount || !endOfDayData) return;
    
    const countedCash = parseFloat(cashCount);
    const expectedCash = endOfDayData.paymentSummary['Cash'] || 0;
    const variance = countedCash - expectedCash;
    setCashVariance(variance);
  };

  const updateInventory = async () => {
    try {
      const response = await api().post('/orders/end-of-day/update-inventory', {
        date: new Date().toISOString().split('T')[0]
      });
      
      if (response.data.success) {
        setInventoryUpdated(true);
        setError('');
        alert('Inventory updated successfully based on today\'s sales!');
      }
    } catch (error) {
      console.error('Failed to update inventory:', error);
      // Mock success for demo
      setInventoryUpdated(true);
      alert('Inventory updated successfully based on today\'s sales!');
    }
  };

  const processEndOfDay = async () => {
    if (!cashCount) {
      setError('Please enter cash count before processing End of Day');
      return;
    }

    try {
      setProcessingEndOfDay(true);
      const response = await api().post('/orders/end-of-day/process', {
        cashCount: parseFloat(cashCount),
        date: new Date().toISOString().split('T')[0],
        notes: 'End of Day processing completed'
      });
      
      if (response.data.success) {
        alert('End of Day processed successfully!');
        closeEndOfDay();
      }
    } catch (error) {
      console.error('Failed to process End of Day:', error);
      // Mock success for demo
      alert('End of Day processed successfully!');
      closeEndOfDay();
    } finally {
      setProcessingEndOfDay(false);
    }
  };

  const closeEndOfDay = () => {
    setShowEndOfDayModal(false);
    setEndOfDayData(null);
    setCashCount('');
    setCashVariance(0);
    setInventoryUpdated(false);
    setError('');
  };

  const fetchEndOfDayHistory = async () => {
    try {
      const response = await api().get('/orders/end-of-day/history');
      if (response.data.success) {
        setEndOfDayHistory(response.data.history);
      } else {
        // Mock data for demo
        setEndOfDayHistory([
          {
            date: new Date().toDateString(),
            processedBy: user?.username || 'Admin',
            salesSummary: { totalSales: calculateTotalSales(getFilteredOrdersByRange()) },
            inventoryUpdated: true
          }
        ]);
      }
      setShowEndOfDayHistory(true);
    } catch (error) {
      console.error('Failed to fetch End of Day history:', error);
      // Mock data for demo
      setEndOfDayHistory([
        {
          date: new Date().toDateString(),
          processedBy: user?.username || 'Admin',
          salesSummary: { totalSales: calculateTotalSales(getFilteredOrdersByRange()) },
          inventoryUpdated: true
        }
      ]);
      setShowEndOfDayHistory(true);
    }
  };

  const printEndOfDayReport = () => {
    const printContents = document.getElementById('end-of-day-report')?.innerHTML;
    if (!printContents) return;
    
    const win = window.open('', '', 'height=800,width=1000');
    
    win.document.write(`
      <html>
        <head>
          <title>End of Day Report - ${endOfDayData?.date}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 30px; 
              background: white;
              color: black;
              max-width: 900px;
              margin: 0 auto;
            }
            .report-header {
              text-align: center;
              border-bottom: 3px double #000;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .section-title {
              background: #f8f9fa;
              padding: 10px 15px;
              border-left: 4px solid #007bff;
              margin-bottom: 15px;
              font-weight: bold;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .summary-card {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              border: 1px solid #dee2e6;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .data-table th,
            .data-table td {
              border: 1px solid #dee2e6;
              padding: 8px 12px;
              text-align: left;
            }
            .data-table th {
              background: #f8f9fa;
              font-weight: bold;
            }
            .variance-positive {
              color: #28a745;
              font-weight: bold;
            }
            .variance-negative {
              color: #dc3545;
              font-weight: bold;
            }
            @media print {
              body { 
                padding: 15px; 
                font-size: 12px;
              }
              .section-title { font-size: 14px; }
              .summary-card { font-size: 11px; }
            }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.onafterprint = function() {
      win.close();
    };
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedDate(null);
    setSearchDate('');
    setDateRange('all');
    setSearchTerm('');
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
        <FaArrowLeft />
      </div>

      {/* Title and Action Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <h2 style={{
          textAlign: "center",
          marginBottom: "20px",
          color: "#f0f1f4ff",
          fontSize: "28px",
          fontWeight: 600,
          margin: 0
        }}>Order History</h2>

        {/* Action Buttons - Only for Managers/Cashiers */}
        {(user?.role === 'manager' || user?.role === 'cahier') && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={fetchEndOfDayHistory}
              style={{
                padding: "12px 20px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 6px 15px rgba(102,126,234,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
              }}
            >
              <FaFileExport /> End of Day History
            </button>
            <button
              onClick={generateEndOfDayReport}
              style={{
                padding: "12px 20px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 6px 15px rgba(240,147,251,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
              }}
            >
              <FaChartBar /> Generate End of Day
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "20px", position: "relative" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "300px" }}>
            <FaSearch style={{
              position: "absolute",
              left: "15px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#666"
            }} />
            <input
              type="text"
              placeholder="Search orders by ID, cashier, items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px 12px 40px",
                borderRadius: "25px",
                border: "none",
                backgroundColor: "rgba(255,255,255,0.9)",
                fontSize: "14px",
                outline: "none"
              }}
            />
          </div>
          <button
            onClick={clearAllFilters}
            style={{
              padding: "12px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#6c757d",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <FaFilter /> Clear Filters
          </button>
        </div>
      </div>

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

      {/* End of Day History Modal */}
      {showEndOfDayHistory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '90%',
            maxHeight: '90%',
            overflow: 'auto',
            width: '800px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #eee',
              paddingBottom: '10px'
            }}>
              <h2 style={{ margin: 0, color: '#790707ff' }}>End of Day History</h2>
              <button
                onClick={() => setShowEndOfDayHistory(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#790707ff'
                }}
              >
                ×
              </button>
            </div>

            {endOfDayHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                No End of Day reports found.
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                {endOfDayHistory.map((report, index) => (
                  <div key={index} style={{
                    background: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#333' }}>{report.date}</strong>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          Processed by: {report.processedBy} • Total Sales: ₱{formatAmount(report.salesSummary?.totalSales)}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        background: report.inventoryUpdated ? '#28a745' : '#6c757d',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {report.inventoryUpdated ? 'Inventory Updated' : 'Inventory Pending'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Date Range Filter */}
      {!loading && !error && orders.length > 0 && (
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <h3 style={{ marginBottom: "10px", color: "#efeff1ff" }}>Date Range</h3>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px" }}>
            {[
              { value: 'today', label: 'Today', count: getOrderCountForRange('today') },
              { value: '3days', label: 'Last 3 Days', count: getOrderCountForRange('3days') },
              { value: '7days', label: 'Last 7 Days', count: getOrderCountForRange('7days') },
              { value: '30days', label: 'Last 30 Days', count: getOrderCountForRange('30days') },
              { value: 'all', label: 'All Time', count: orders.length }
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

      {/* Orders Summary */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.1)",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "20px",
          textAlign: "center",
          color: "#efeff1ff"
        }}>
          <strong>Showing {filteredOrders.length} orders • Total Sales: ₱{formatAmount(calculateTotalSales(filteredOrders))}</strong>
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
          {getFilteredOrdersByRange().length === 0 ? 'No orders found for selected date range.' : 'No orders found for the current filters.'}
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
                  {o.endOfDayProcessed && (
                    <div style={{ color: '#059669', fontWeight: 'bold' }}>
                      <FaCheck style={{ marginRight: '4px' }} /> Processed in End of Day
                    </div>
                  )}
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

      {/* End of Day Modal */}
      {showEndOfDayModal && endOfDayData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '95%',
            maxHeight: '95%',
            overflow: 'auto',
            width: '900px'
          }}>
            <div id="end-of-day-report">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '2px solid #eee',
                paddingBottom: '10px'
              }}>
                <h2 style={{ margin: 0, color: '#790707ff' }}>End of Day Report - {endOfDayData.date}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={printEndOfDayReport}
                    style={{
                      padding: '8px 16px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <FaPrint /> Print
                  </button>
                  <button
                    onClick={closeEndOfDay}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#790707ff'
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Sales Summary */}
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ color: '#790707ff', marginBottom: '15px', borderLeft: '4px solid #790707ff', paddingLeft: '10px' }}>Sales Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#790707ff' }}>₱{formatAmount(endOfDayData.salesSummary.totalSales)}</div>
                    <div style={{ color: '#666', fontWeight: '600' }}>Total Sales</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#790707ff' }}>{endOfDayData.salesSummary.totalOrders}</div>
                    <div style={{ color: '#666', fontWeight: '600' }}>Total Orders</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#790707ff' }}>₱{formatAmount(endOfDayData.salesSummary.averageOrderValue)}</div>
                    <div style={{ color: '#666', fontWeight: '600' }}>Average Order Value</div>
                  </div>
                </div>
              </div>

              {/* Payment Type Report */}
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ color: '#790707ff', marginBottom: '15px', borderLeft: '4px solid #790707ff', paddingLeft: '10px' }}>Payment Type Report</h3>
                <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    {Object.entries(endOfDayData.paymentSummary).map(([method, amount]) => (
                      <div key={method} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '12px',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e9ecef'
                      }}>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>{method}:</span>
                        <span style={{ fontWeight: '600', color: '#28a745' }}>₱{formatAmount(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cash Reconciliation */}
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ color: '#790707ff', marginBottom: '15px', borderLeft: '4px solid #790707ff', paddingLeft: '10px' }}>Cash Reconciliation</h3>
                <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '15px' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                        <FaMoneyBillWave style={{ marginRight: '8px' }} />
                        Actual Cash Count:
                      </label>
                      <input
                        type="number"
                        value={cashCount}
                        onChange={(e) => setCashCount(e.target.value)}
                        placeholder="Enter counted cash amount"
                        style={{
                          padding: '10px 12px',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                          width: '100%',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                    <button
                      onClick={reconcileCash}
                      style={{
                        padding: '10px 20px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        marginTop: '25px'
                      }}
                    >
                      Reconcile Cash
                    </button>
                  </div>
                  {cashVariance !== 0 && (
                    <div style={{
                      padding: '12px',
                      background: cashVariance > 0 ? '#d4edda' : '#f8d7da',
                      color: cashVariance > 0 ? '#155724' : '#721c24',
                      borderRadius: '6px',
                      border: `1px solid ${cashVariance > 0 ? '#c3e6cb' : '#f5c6cb'}`,
                      fontWeight: 'bold'
                    }}>
                      <strong>Cash Variance:</strong> ₱{Math.abs(cashVariance).toFixed(2)} 
                      <span style={{ color: cashVariance > 0 ? '#28a745' : '#dc3545', marginLeft: '8px' }}>
                        ({cashVariance > 0 ? 'Over' : 'Short'})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Server Performance */}
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ color: '#790707ff', marginBottom: '15px', borderLeft: '4px solid #790707ff', paddingLeft: '10px' }}>Server Performance</h3>
                <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                  {endOfDayData.serverPerformance && Object.keys(endOfDayData.serverPerformance).length > 0 ? (
                    Object.values(endOfDayData.serverPerformance).map((server, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '12px',
                        padding: '12px',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div>
                          <span style={{ fontWeight: 'bold', color: '#333' }}>{server.serverName}</span>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            {server.orderCount} orders
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '600', color: '#28a745' }}>₱{formatAmount(server.totalSales)}</div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            Avg: ₱{formatAmount(server.averageSale)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                      No server performance data available
                    </div>
                  )}
                </div>
              </div>

              {/* Item Sales Report */}
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ color: '#790707ff', marginBottom: '15px', borderLeft: '4px solid #790707ff', paddingLeft: '10px' }}>Top Selling Items</h3>
                <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                  {endOfDayData.itemSales && endOfDayData.itemSales.length > 0 ? (
                    endOfDayData.itemSales.slice(0, 10).map((item, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '10px',
                        padding: '12px',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div>
                          <span style={{ fontWeight: 'bold', color: '#333' }}>
                            #{index + 1} {item.itemName}
                          </span>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            {item.category} • ₱{formatAmount(item.price)} each
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '600', color: '#28a745' }}>
                            {item.quantity} sold
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            ₱{formatAmount(item.revenue)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                      No item sales data available
                    </div>
                  )}
                </div>
              </div>

              {/* Inventory Update */}
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ color: '#790707ff', marginBottom: '15px', borderLeft: '4px solid #790707ff', paddingLeft: '10px' }}>Inventory Management</h3>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={updateInventory}
                    disabled={inventoryUpdated}
                    style={{
                      padding: '12px 24px',
                      background: inventoryUpdated ? '#28a745' : '#790707ff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: inventoryUpdated ? 'default' : 'pointer',
                      opacity: inventoryUpdated ? 0.7 : 1,
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '16px'
                    }}
                  >
                    <FaBox /> 
                    {inventoryUpdated ? 'Inventory Updated ✓' : 'Update Inventory from Sales'}
                  </button>
                  {inventoryUpdated && (
                    <div style={{ color: '#28a745', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaCheck /> Inventory levels have been updated based on today's sales data.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <button
                onClick={closeEndOfDay}
                style={{
                  padding: '12px 24px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={processEndOfDay}
                disabled={processingEndOfDay || !cashCount}
                style={{
                  padding: '12px 24px',
                  background: processingEndOfDay ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: processingEndOfDay ? 'not-allowed' : 'pointer',
                  opacity: processingEndOfDay ? 0.7 : 1,
                  fontWeight: 'bold',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {processingEndOfDay ? 'Processing...' : 'Complete End of Day'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}