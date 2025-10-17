import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaChartBar, 
  FaSync, 
  FaExclamationTriangle, 
  FaShoppingCart, 
  FaBox, 
  FaMoneyBillWave, 
  FaCalendarWeek,
  FaCalendarAlt,
  FaCalendar,
  FaStar,
  FaTag,
  FaList,
  FaChartLine,
  FaDollarSign,
  FaReceipt
} from 'react-icons/fa';

export default function POSAnalytics() {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  // State for analytics data
  const [salesData, setSalesData] = useState({ 
    daily: 0, 
    weekly: 0, 
    monthly: 0, 
    yearly: 0,
    dailyOrders: 0,
    weeklyOrders: 0,
    monthlyOrders: 0,
    yearlyOrders: 0,
    popularItems: [],
    salesByCategory: [],
    summary: {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    }
  });
  
  // State for UI
  const [analyticsError, setAnalyticsError] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [timeRange, setTimeRange] = useState('today'); // today, week, month, year
  const [periodData, setPeriodData] = useState([]);

  // Create axios instance with baseURL
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {} 
  });

  // Load sales data
  const loadSalesData = useCallback(async () => {
    setAnalyticsError('');
    
    try {
      console.log('Loading sales data from /orders/analytics/sales-summary...');
      const res = await api.get('/orders/analytics/sales-summary');
      
      if (res.data.success) {
        console.log('Sales data loaded successfully:', res.data.data);
        const data = res.data.data;
        setSalesData(data);
        
        // Create debug info from the successful response
        setDebugInfo({
          totalOrders: data.summary?.totalOrders || 0,
          completeOrders: data.summary?.totalOrders || 0,
          todayOrders: data.dailyOrders || 0,
          sampleOrders: data.popularItems?.slice(0, 3).map(item => ({
            status: 'complete',
            totalAmount: item.totalRevenue,
            createdAt: new Date().toISOString()
          })) || []
        });
      } else {
        console.error('API returned success: false', res.data);
        setAnalyticsError('Failed to load analytics data: API returned error');
      }
    } catch (err) {
      console.error('Error loading sales data:', err);
      console.error('Error details:', err.response?.data);
      
      let errorMessage = 'Failed to load analytics data';
      if (err.response?.status === 404) {
        errorMessage = 'Analytics endpoint not found. Check if backend is running.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setAnalyticsError(errorMessage);
    }
  }, [api]);

  // Load period data
  const loadPeriodData = useCallback(async (period) => {
    try {
      const res = await api.get(`/orders/analytics/sales-by-period?period=${period}`);
      if (res.data.success) {
        setPeriodData(res.data.data || []);
      } else {
        console.warn('Period data API returned success: false');
        setPeriodData([]);
      }
    } catch (err) {
      console.error('Error loading period data:', err);
      setPeriodData([]);
    }
  }, [api]);

  // Load all data
  const loadAllData = useCallback(async () => {
    try {
      await loadSalesData();
      await loadPeriodData(timeRange);
    } catch (error) {
      console.error('Error loading all data:', error);
    }
  }, [loadSalesData, loadPeriodData, timeRange]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Refresh analytics data
  const refreshAnalytics = async () => {
    await loadAllData();
  };

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    loadPeriodData(range);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get time range label
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return 'Today';
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#790707ff', 
      minHeight: '100vh',
      fontFamily: "'Arial', sans-serif"
    }}>
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '30px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FaArrowLeft 
            style={{ 
              marginRight: '12px', 
              color: '#ededf5ff', 
              cursor: 'pointer', 
              fontSize: '20px' 
            }} 
            onClick={() => navigate(-1)} 
          />
          <h1 style={{ 
            margin: 0, 
            color: '#ededf5ff', 
            fontWeight: '700', 
            fontSize: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <FaChartBar /> POS Analytics Dashboard
          </h1>
        </div>
        <button 
          onClick={refreshAnalytics}
          style={{
            padding: '12px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#0056b3';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#007bff';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <FaSync /> Refresh Data
        </button>
      </div>

      {/* Error Message */}
      {analyticsError && (
        <div style={{ 
          padding: '16px', 
          background: '#fff3cd', 
          color: '#856404', 
          borderRadius: '8px', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          border: '1px solid #ffeaa7',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <FaExclamationTriangle size={20} /> 
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Analytics Error</strong>
            {analyticsError}
            <div style={{ fontSize: '14px', marginTop: '8px' }}>
              Check if orders exist and have 'complete' status. Make sure your backend is running.
            </div>
          </div>
        </div>
      )}

      {/* Debug Information */}
      {debugInfo && (
        <div style={{ 
          background: 'rgba(255,255,255,0.9)', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '24px',
          fontSize: '14px',
          color: '#333',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <strong style={{ display: 'block', marginBottom: '8px', color: '#007bff' }}>
            System Overview
          </strong>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div>
              <span style={{ color: '#666' }}>Total Orders: </span>
              <strong style={{ color: '#333' }}>{debugInfo.totalOrders}</strong>
            </div>
            <div>
              <span style={{ color: '#666' }}>Complete Orders: </span>
              <strong style={{ color: '#28a745' }}>{debugInfo.completeOrders}</strong>
            </div>
            <div>
              <span style={{ color: '#666' }}>Orders Today: </span>
              <strong style={{ color: '#007bff' }}>{debugInfo.todayOrders}</strong>
            </div>
            <div>
              <span style={{ color: '#666' }}>Last Updated: </span>
              <strong style={{ color: '#333' }}>{new Date().toLocaleTimeString()}</strong>
            </div>
          </div>
          {debugInfo.sampleOrders && debugInfo.sampleOrders.length > 0 && (
            <div>
              <strong style={{ color: '#666', fontSize: '12px' }}>Recent Orders Sample:</strong>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {debugInfo.sampleOrders.map((order, index) => (
                  <div key={index} style={{ 
                    fontSize: '11px', 
                    padding: '6px 8px', 
                    background: '#e9ecef', 
                    borderRadius: '6px',
                    border: '1px solid #dee2e6'
                  }}>
                    {order.status} • {formatCurrency(order.totalAmount)} • {formatDate(order.createdAt)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Analytics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        
        {/* Sales Summary Cards */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
          transition: 'transform 0.3s ease'
        }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
           onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <FaMoneyBillWave size={32} style={{ marginBottom: '12px', opacity: 0.9 }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Today's Sales</h3>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(salesData.daily)}</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
            <FaShoppingCart style={{ marginRight: '4px' }} />
            {salesData.dailyOrders || 0} orders
          </p>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
          transition: 'transform 0.3s ease'
        }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
           onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <FaCalendarWeek size={32} style={{ marginBottom: '12px', opacity: 0.9 }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>This Week</h3>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(salesData.weekly)}</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
            <FaReceipt style={{ marginRight: '4px' }} />
            {salesData.weeklyOrders || 0} orders
          </p>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
          transition: 'transform 0.3s ease'
        }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
           onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <FaCalendarAlt size={32} style={{ marginBottom: '12px', opacity: 0.9 }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>This Month</h3>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(salesData.monthly)}</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
            <FaChartLine style={{ marginRight: '4px' }} />
            {salesData.monthlyOrders || 0} orders
          </p>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
          transition: 'transform 0.3s ease'
        }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
           onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <FaCalendar size={32} style={{ marginBottom: '12px', opacity: 0.9 }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>This Year</h3>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{formatCurrency(salesData.yearly)}</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
            <FaDollarSign style={{ marginRight: '4px' }} />
            {salesData.yearlyOrders || 0} orders
          </p>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center',
          border: '1px solid #e9ecef',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease'
        }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
           onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <FaReceipt size={24} style={{ color: '#007bff', marginBottom: '8px' }} />
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Revenue</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
            {formatCurrency(salesData.summary?.totalRevenue)}
          </div>
        </div>
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center',
          border: '1px solid #e9ecef',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease'
        }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
           onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <FaShoppingCart size={24} style={{ color: '#28a745', marginBottom: '8px' }} />
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Orders</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
            {salesData.summary?.totalOrders || 0}
          </div>
        </div>
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center',
          border: '1px solid #e9ecef',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease'
        }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
           onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <FaChartLine size={24} style={{ color: '#ffc107', marginBottom: '8px' }} />
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Avg Order Value</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
            {formatCurrency(salesData.summary?.averageOrderValue)}
          </div>
        </div>
      </div>

      {/* Two Column Layout for Popular Items and Sales by Category */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginBottom: '30px'
      }}>
        
        {/* Popular Items */}
        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FaStar style={{ color: '#ffc107' }} /> Popular Items
          </h3>
          
          {salesData.popularItems && salesData.popularItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {salesData.popularItems.slice(0, 8).map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  transition: 'all 0.2s ease'
                }} onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                   onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '6px',
                      background: index < 3 ? '#007bff' : '#6c757d',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>
                        {item._id || 'Unknown Item'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {item.category || 'Uncategorized'} • {item.totalQuantity || 0} sold
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#28a745', fontSize: '14px' }}>
                      {formatCurrency(item.totalRevenue)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Avg: {formatCurrency(item.averagePrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !analyticsError && (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                color: '#666',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <FaBox size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <div>No popular items data available</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                  Popular items will appear here as orders are completed
                </div>
              </div>
            )
          )}
        </div>

        {/* Sales by Category */}
        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FaTag style={{ color: '#6f42c1' }} /> Sales by Category
          </h3>
          
          {salesData.salesByCategory && salesData.salesByCategory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {salesData.salesByCategory.map((category, index) => (
                <div key={index} style={{
                  padding: '16px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  transition: 'all 0.2s ease'
                }} onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                   onMouseLeave={(e) => e.currentTarget.style.background = '##f8f9fa'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#333', 
                      fontSize: '14px',
                      textTransform: 'capitalize'
                    }}>
                      {category.category || 'Uncategorized'}
                    </span>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: '#28a745',
                      fontSize: '16px'
                    }}>
                      {formatCurrency(category.totalRevenue)}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '13px', 
                    color: '#666' 
                  }}>
                    <span>{category.totalQuantity || 0} items sold</span>
                    <span>{category.itemCount || 0} unique items</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !analyticsError && (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                color: '#666',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <FaList size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <div>No category sales data available</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                  Category data will appear here as orders are completed
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Time Range Selector and Chart Section */}
      <div style={{
        background: '#fff',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            margin: 0, 
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FaChartLine style={{ color: '#007bff' }} /> Sales Trend - {getTimeRangeLabel()}
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['today', 'week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                style={{
                  padding: '8px 16px',
                  background: timeRange === range ? '#007bff' : '#f8f9fa',
                  color: timeRange === range ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {periodData.length > 0 ? (
          <div style={{ 
            background: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'grid', gap: '12px' }}>
              {periodData.map((data, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'white',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6'
                }}>
                  <span style={{ fontWeight: '600', color: '#333' }}>{data._id}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#28a745' }}>
                      {formatCurrency(data.totalSales)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {data.orderCount} orders • Avg: {formatCurrency(data.averageOrder)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#666',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <FaChartLine size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div>No sales data available for {getTimeRangeLabel().toLowerCase()}</div>
            <div style={{ fontSize: '14px', marginTop: '8px' }}>
              Sales trend data will appear here as orders are completed
            </div>
          </div>
        )}
      </div>

      {/* Troubleshooting Guide */}
      {(salesData.daily === 0 && salesData.weekly === 0 && salesData.monthly === 0) && !analyticsError && (
        <div style={{ 
          padding: '20px',
          background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
          borderRadius: '12px',
          border: '1px solid #ffc107',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            color: '#856404',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaExclamationTriangle /> Troubleshooting Guide
          </h4>
          <div style={{ fontSize: '14px', color: '#856404', lineHeight: '1.6' }}>
            <p><strong>If you're seeing zeros but have orders:</strong></p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Ensure orders have status: <strong>"complete"</strong> in the database</li>
              <li>Check if orders were created within the current time periods</li>
              <li>Verify your backend server is running and accessible</li>
              <li>Check the System Overview above for order counts</li>
              <li>Click "Refresh Data" to reload the latest information</li>
              <li>Make sure orders have valid totalAmount values</li>
            </ul>
            <p style={{ marginTop: '12px', fontSize: '13px' }}>
              <strong>Note:</strong> Analytics only include orders with status "complete". 
              Make sure your orders are being saved correctly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}