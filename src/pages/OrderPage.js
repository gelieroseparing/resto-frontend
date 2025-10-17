// src/pages/OrderPage.js 
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTrash, FaPlus, FaMinus, FaHome, FaPrint, FaShoppingCart, FaCog, FaTimes, FaCheck, FaArrowLeft, FaBox } from 'react-icons/fa';

export default function OrderPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Set initial orderType to 'Take-out' (matching backend enum)
  const [orderType, setOrderType] = useState('Take-out');
  const [items, setItems] = useState([{ category: '', name: '', quantity: 1, price: 0 }]);
  const [menuItems, setMenuItems] = useState([]);
  const [lastOrder, setLastOrder] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [additionalPayments, setAdditionalPayments] = useState([]);
  const [tenderedAmount, setTenderedAmount] = useState(''); // NEW: Tendered amount
  const [changeAmount, setChangeAmount] = useState(0);      // NEW: Change amount
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const printRef = useRef();

  // Create axios instance with baseURL
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {} 
  });
  
  // Calculate totals FIRST
  const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTotalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const additionalPaymentsTotal = additionalPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
  const totalAmount = itemsTotal + additionalPaymentsTotal;

  // Load cart items from navigation state AND localStorage
  useEffect(() => {
    // Load from navigation state
    if (location.state?.cartItems) {
      setCartItems(location.state.cartItems);
      // Also save to localStorage for persistence
      localStorage.setItem('cartItems', JSON.stringify(location.state.cartItems));
    } else {
      // Load from localStorage if no navigation state
      const savedCartItems = localStorage.getItem('cartItems');
      if (savedCartItems) {
        setCartItems(JSON.parse(savedCartItems));
      }
    }
    
    if (location.state?.preselect) {
      const item = location.state.preselect;
      setItems([{ 
        category: item.category, 
        name: item.name, 
        quantity: 1, 
        price: item.price 
      }]);
    }
  }, [location.state]);

  // Load menu items
  const loadMenuItems = useCallback(async () => {
    try {
      const res = await api.get('/items');
      setMenuItems(res.data);
    } catch (err) {
      console.error('Error loading menu:', err);
      setError('Failed to load menu items');
      setTimeout(() => setError(''), 5000);
    }
  }, [api]);

  useEffect(() => {
    loadMenuItems();
  }, [loadMenuItems]);

  // Calculate change when tendered amount changes - MOVED AFTER totalAmount declaration
  useEffect(() => {
    if (tenderedAmount && !isNaN(parseFloat(tenderedAmount))) {
      const change = parseFloat(tenderedAmount) - totalAmount;
      setChangeAmount(change > 0 ? change : 0);
    } else {
      setChangeAmount(0);
    }
  }, [tenderedAmount, totalAmount]);

  // Add new item row
  const handleAddItem = () => {
    setItems([...items, { category: '', name: '', quantity: 1, price: 0 }]);
  };

  // Handle change in item selection or quantity
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'name') {
      const found = menuItems.find(m => m.name === value);
      if (found) {
        updated[index].price = found.price;
        updated[index].category = found.category;
        updated[index].stock = found.stock || 0; // Add stock info
      } else {
        updated[index].price = 0;
        updated[index].stock = 0;
      }
    }

    if (field === 'category') {
      updated[index].name = '';
      updated[index].price = 0;
      updated[index].stock = 0;
    }

    setItems(updated);
  };

  // Remove item from order form
  const removeItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated.length === 0 ? [{ category: '', name: '', quantity: 1, price: 0 }] : updated);
  };

  // Add cart items to order items
  const addCartToOrder = () => {
    if (cartItems.length === 0) {
      setError('Cart is empty!');
      setTimeout(() => setError(''), 5000);
      return;
    }

    const cartItemsAsOrderItems = cartItems.map(item => ({
      category: item.category,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      stock: item.stock || 0
    }));

    setItems([...items.filter(item => item.name), ...cartItemsAsOrderItems]);
    setCartItems([]);
    localStorage.removeItem('cartItems'); // Clear cart from localStorage
    setSuccess('Cart items added to order!');
    setTimeout(() => setSuccess(''), 5000);
  };

  // Remove item from cart
  const removeFromCart = (index) => {
    const updatedCart = [...cartItems];
    updatedCart.splice(index, 1);
    setCartItems(updatedCart);
    localStorage.setItem('cartItems', JSON.stringify(updatedCart)); // Update localStorage
  };

  // Update cart item quantity
  const updateCartQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = [...cartItems];
    const item = updatedCart[index];
    
    // Check stock availability
    const menuItem = menuItems.find(m => m.name === item.name);
    if (menuItem && (menuItem.stock || 0) < newQuantity) {
      setError(`Not enough stock for ${item.name}. Available: ${menuItem.stock || 0}`);
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    updatedCart[index].quantity = newQuantity;
    setCartItems(updatedCart);
    localStorage.setItem('cartItems', JSON.stringify(updatedCart)); // Update localStorage
  };

  // Add additional payment (like tupperware)
  const handleAddAdditionalPayment = () => {
    setAdditionalPayments([...additionalPayments, { description: '', amount: 0 }]);
  };

  // Handle change in additional payment
  const handleAdditionalPaymentChange = (index, field, value) => {
    const updated = [...additionalPayments];
    updated[index][field] = value;
    setAdditionalPayments(updated);
  };

  // Remove additional payment
  const handleRemoveAdditionalPayment = (index) => {
    const updated = [...additionalPayments];
    updated.splice(index, 1);
    setAdditionalPayments(updated);
  };

  // Get available stock for an item
  const getAvailableStock = (itemName) => {
    const menuItem = menuItems.find(m => m.name === itemName);
    return menuItem ? (menuItem.stock || 0) : 0;
  };

  // Place new order with stock deduction - UPDATED WITH TENDERED & CHANGE
  const handlePlaceOrder = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const allItems = [...items.filter(item => item.name && item.category)];
      
      if (allItems.length === 0) {
        setError('Please add at least one item.');
        setTimeout(() => setError(''), 5000);
        setIsLoading(false);
        return;
      }
      
      // Validate tendered amount
      if (tenderedAmount && parseFloat(tenderedAmount) < totalAmount) {
        setError(`Tendered amount (₱${parseFloat(tenderedAmount).toFixed(2)}) is less than total amount (₱${totalAmount.toFixed(2)})`);
        setTimeout(() => setError(''), 5000);
        setIsLoading(false);
        return;
      }
      
      // Check stock availability before placing order
      for (const item of allItems) {
        const menuItem = menuItems.find(m => m.name === item.name);
        if (!menuItem) {
          setError(`Item ${item.name} not found in menu.`);
          setTimeout(() => setError(''), 5000);
          setIsLoading(false);
          return;
        }
        
        if ((menuItem.stock || 0) < item.quantity) {
          setError(`Not enough stock for ${item.name}. Available: ${menuItem.stock || 0}, Requested: ${item.quantity}`);
          setTimeout(() => setError(''), 5000);
          setIsLoading(false);
          return;
        }
      }
      
      // Create order data with all necessary fields - INCLUDING TENDERED & CHANGE
      const orderData = {
        orderType, // Now uses 'Take-out', 'Dine-in', 'Delivery' (matching backend enum)
        items: allItems,
        additionalPayments: additionalPayments.filter(p => p.description && p.amount > 0),
        totalAmount: totalAmount,
        subtotal: itemsTotal,
        paymentMethod: 'Cash',
        tenderedAmount: tenderedAmount ? parseFloat(tenderedAmount) : undefined, // NEW
        changeAmount: changeAmount > 0 ? changeAmount : undefined,               // NEW
        createdBy: user?.username || 'Unknown',
        status: 'complete' // ← CRITICAL: This ensures orders appear in POS Analytics
      };
      
      console.log('Placing order with data:', orderData); // Debug log
      
      const res = await api.post('/orders', orderData);
      setSuccess('Order placed successfully!');
      
      // Deduct stock from inventory
      for (const item of allItems) {
        const menuItem = menuItems.find(m => m.name === item.name);
        if (menuItem) {
          const newStock = Math.max(0, (menuItem.stock || 0) - item.quantity);
          await api.put(`/items/${menuItem._id}`, { stock: newStock });
          
          // Update local state to reflect stock changes
          setMenuItems(prev => prev.map(m => 
            m._id === menuItem._id ? { ...m, stock: newStock } : m
          ));
        }
      }
      
      // Save the complete order data for the receipt
      setLastOrder({
        ...res.data.order,
        items: orderData.items,
        additionalPayments: orderData.additionalPayments,
        totalAmount: orderData.totalAmount,
        subtotal: orderData.subtotal,
        paymentMethod: orderData.paymentMethod,
        tenderedAmount: orderData.tenderedAmount, // NEW
        changeAmount: orderData.changeAmount,     // NEW
        createdBy: orderData.createdBy,
        orderType: orderData.orderType,
        status: orderData.status // Include status in receipt data
      });
      
      // Set order as placed to show print section
      setIsOrderPlaced(true);
      
      // Reset the form and cart
      setItems([{ category: '', name: '', quantity: 1, price: 0 }]);
      setCartItems([]);
      setAdditionalPayments([]);
      setTenderedAmount(''); // NEW: Reset tendered amount
      setChangeAmount(0);    // NEW: Reset change amount
      localStorage.removeItem('cartItems'); // Clear cart from localStorage
    } catch (err) {
      console.error('Order error:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.join(', ') || 
                          'Error placing order';
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Print order
  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const win = window.open('', '', 'height=600,width=800');
    
    // Get order details for the print title
    const orderId = lastOrder?._id || lastOrder?.orderId || 'N/A';
    
    win.document.write(`
      <html>
        <head>
          <title>Order Receipt - ${orderId}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              background: white;
              color: black;
              max-width: 400px;
              margin: 0 auto;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .order-info {
              background: #f8f9fa;
              padding: 12px;
              border-radius: 8px;
              margin-bottom: 15px;
            }
            .order-details {
              display: grid;
              gridTemplateColumns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 10px;
            }
            .order-item {
              padding: 8px 0;
              border-bottom: 1px dotted #ccc;
              display: flex;
              justify-content: space-between;
            }
            .order-total {
              font-weight: bold;
              font-size: 18px;
              padding: 12px;
              background: #f8f9fa;
              border-radius: 8px;
              border: 2px solid #000;
              margin-top: 15px;
            }
            .payment-info {
              background: #e9ecef;
              padding: 10px;
              border-radius: 8px;
              margin: 10px 0;
              border: 1px solid #dee2e6;
            }
            .thank-you {
              text-align: center;
              font-style: italic;
              margin-top: 20px;
              color: #666;
            }
            .stock-info {
              font-size: 10px;
              color: #666;
              margin-top: 2px;
            }
            .low-stock {
              color: #dc3545;
              font-weight: bold;
            }
            .status-badge {
              background: #28a745;
              color: white;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: bold;
              margin-left: 8px;
            }
            @media print {
              body { 
                padding: 10px; 
                font-size: 12px;
              }
              .receipt-header { font-size: 16px; }
              .order-total { font-size: 16px; }
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

  // Create new order - go back to order form
  const handleNewOrder = () => {
    setIsOrderPlaced(false);
    setLastOrder(null);
    setItems([{ category: '', name: '', quantity: 1, price: 0 }]);
    setAdditionalPayments([]);
    setTenderedAmount('');
    setChangeAmount(0);
    // Note: Don't clear cartItems here to preserve cart for future orders
  };

  // Safe function to format amount with fallback
  const formatAmount = (amount) => {
    return amount ? parseFloat(amount).toFixed(2) : '0.00';
  };

  // Get unique categories from menu items
  const categories = [...new Set(menuItems.map(item => item.category))];

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: '#790707ff' }}>

      {/* Top Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        background: '#c9c6c7ff',
        padding: '16px 20px',
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            style={{ 
              fontSize: 20, 
              cursor: 'pointer', 
              background: '#790707ff', 
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
            onClick={() => navigate('/home')}
          >
            <FaHome />
          </button>
          <h2 style={{ margin: 0, color: '#790707ff', fontFamily: 'Arial Rounded MT Bold, sans-serif' }}>
            {isOrderPlaced ? 'Order Receipt' : 'Order Page'}
          </h2>
        </div>
        
        {/* Cart Items Count - Always visible */}
        {!isOrderPlaced && cartItems.length > 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: '#790707ff',
            padding: '8px 16px',
            borderRadius: '20px',
            color: 'white',
            fontWeight: 'bold'
          }}>
            <FaShoppingCart />
            <span>Cart: {cartItems.length} items</span>
          </div>
        )}
        
        {/* Back to Order Button when in receipt view */}
        {isOrderPlaced && (
          <button
            onClick={handleNewOrder}
            style={{ 
              padding: '10px 16px', 
              borderRadius: 12, 
              border: 'none', 
              background: '#790707ff', 
              color: 'white', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}
          >
            <FaArrowLeft /> New Order
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          padding: '12px 16px', 
          background: '#ffcccc', 
          color: '#d63031', 
          borderRadius: '8px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid #ff6b6b'
        }}>
          <FaTimes /> {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div style={{ 
          padding: '12px 16px', 
          background: '#d4edda', 
          color: '#155724', 
          borderRadius: '8px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid #c3e6cb'
        }}>
          <FaCheck /> {success}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div style={{ 
          padding: '12px 16px', 
          background: '#d1ecf1', 
          color: '#0c5460', 
          borderRadius: '8px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          Processing your order...
        </div>
      )}

      {/* ORDER FORM SECTION - Only show when no order is placed */}
      {!isOrderPlaced && (
        <>
          {/* Cart Items Section - Always show if there are cart items */}
          {cartItems.length > 0 && (
            <div style={{ 
              background: '#ca9a9aff', 
              padding: 24, 
              borderRadius: 20, 
              boxShadow: '0 8px 20px rgba(0,0,0,0.08)', 
              maxWidth: 800, 
              margin: '0 auto', 
              marginBottom: 20,
              border: '2px solid #c54e88ff'
            }}>
              <h3 style={{ 
                color: '#0a0c11ff', 
                marginBottom: 16, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontFamily: 'Arial Rounded MT Bold, sans-serif'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FaShoppingCart /> Cart Items ({cartItems.length})
                </span>
                <span>Total: ₱{formatAmount(cartTotalAmount)}</span>
              </h3>
              
              {cartItems.map((item, index) => {
                const availableStock = getAvailableStock(item.name);
                const isLowStock = availableStock < item.quantity;
                
                return (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px', 
                    marginBottom: '8px', 
                    backgroundColor: isLowStock ? '#d18fb3ff' : '#dbb5bfff',
                    borderRadius: '12px',
                    border: `1px solid ${isLowStock ? '#ff6b93' : '#790707ff'}`
                  }}>
                    <div style={{ flex: 2 }}>
                      <div style={{ fontWeight: '600', color: '#170b11ff' }}>{item.name}</div>
                      <div style={{ fontSize: '14px', color: '#1b0d11ff' }}>{item.category}</div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: isLowStock ? '#ff6b93' : '#ff6b93',
                        fontWeight: isLowStock ? 'bold' : 'normal'
                      }}>
                        Stock: {availableStock} {isLowStock && `(Low Stock!)`}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => updateCartQuantity(index, item.quantity - 1)}
                        style={{ 
                          padding: '6px', 
                          borderRadius: '8px', 
                          border: '1px solid #790707ff', 
                          background: '#1b1515ff', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FaMinus size={15} color="#ff6b93" />
                      </button>
                      
                      <span style={{ 
                        minWidth: '30px', 
                        textAlign: 'center', 
                        fontWeight: '700',
                        color: '#0c090aff'
                      }}>
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => updateCartQuantity(index, item.quantity + 1)}
                        style={{ 
                          padding: '6px', 
                          borderRadius: '8px', 
                          border: '1px solid #790707ff', 
                          background: '#0b0909ff', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        disabled={availableStock <= item.quantity}
                      >
                        <FaPlus size={15} color={availableStock > item.quantity ? "#ff6b93" : "#ccc"} />
                      </button>
                    </div>
                    
                    <div style={{ 
                      minWidth: '70px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#1d1416ff'
                    }}>
                      ₱{formatAmount(item.price * item.quantity)}
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(index)}
                      style={{ 
                        padding: '8px', 
                        borderRadius: '8px', 
                        border: 'none', 
                        background: '#191515ff', 
                        color: '#ff6b93', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Remove from cart"
                    >
                      <FaTrash size={15} />
                    </button>
                  </div>
                );
              })}
              
              <button
                onClick={addCartToOrder}
                style={{ 
                  marginTop: '16px', 
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  border: 'none', 
                  background: '#3f3535ff', 
                  color: '#ff6b93', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <FaPlus /> Add All Cart Items to Order
              </button>
            </div>
          )}

          {/* Order Form */}
          <div style={{ 
            background: '#ca9a9aff', 
            padding: 24, 
            borderRadius: 20, 
            boxShadow: '0 8px 20px rgba(0,0,0,0.08)', 
            maxWidth: 800, 
            margin: '0 auto', 
            marginBottom: 40,
            border: '2px solid #cc577eff'
          }}>
            <h3 style={{ 
              color: '#181213ff', 
              marginBottom: 16,
              fontFamily: 'Arial Rounded MT Bold, sans-serif'
            }}>
              Customer Order Entry
            </h3>

            {/* Order Type - FIXED OPTION VALUES */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: '600', color: '#0f060aff', marginRight: 8 }}><strong>Order Type:</strong></label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 12, 
                  border: '2px solid #754752ff',
                  background: '#ddb7bfff',
                  color: '#1e171aff',
                  fontWeight: '500'
                }}
              >
                <option value="Dine-in">Dine-in</option>
                <option value="Take-out">Take-out</option>
                <option value="Delivery">Delivery</option>
              </select>
            </div>

            {/* Items */}
            {items.map((item, index) => {
              const availableItems = item.category
                ? menuItems.filter(m => m.category === item.category && m.isAvailable)
                : [];
              const availableStock = getAvailableStock(item.name);
              const isLowStock = availableStock < item.quantity;

              return (
                <div key={index} style={{ 
                  display: 'flex', 
                  gap: 8, 
                  marginBottom: 12, 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  padding: '12px',
                  backgroundColor: isLowStock ? '#dc9ac2ff' : 'transparent',
                  borderRadius: '12px',
                  border: isLowStock ? '1px solid #ff6b93' : 'none'
                }}>
                  <select
                    value={item.category}
                    onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                    style={{ 
                      flex: 1, 
                      padding: '10px', 
                      borderRadius: 12, 
                      border: '2px solid #754752ff',
                      background: '#ddb7bfff',
                      color: '#1c1619ff',
                      minWidth: '120px'
                    }}
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <select
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    style={{ 
                      flex: 2, 
                      padding: '10px', 
                      borderRadius: 12, 
                      border: '2px solid ' + (!item.category ? '#754752ff' : '#695252ff'),
                      background: !item.category ? '#ddb7bfff' : '#ddb7bfff',
                      color: '#140e11ff',
                      minWidth: '150px'
                    }}
                    disabled={!item.category}
                  >
                    <option value="">-- Select Item --</option>
                    {availableItems.map((m) => (
                      <option key={m._id} value={m.name}>
                        {m.name} - ₱{m.price} (Stock: {m.stock || 0})
                      </option>
                    ))}
                  </select>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      style={{ 
                        width: 70, 
                        padding: '10px', 
                        borderRadius: 12, 
                        border: `2px solid ${isLowStock ? '#0c0b0bff' : '#754752ff'}`, 
                        textAlign: 'center',
                        background: '#ddb7bfff',
                        color: '#211b1eff'
                      }}
                    />
                    {item.name && (
                      <div style={{ 
                        fontSize: '10px', 
                        color: isLowStock ? '#0b0a0aff' : '#0d0c0cff',
                        marginTop: '4px',
                        fontWeight: isLowStock ? 'bold' : 'normal'
                      }}>
                        Stock: {availableStock}
                      </div>
                    )}
                  </div>

                  <div style={{ 
                    minWidth: 90, 
                    textAlign: 'right', 
                    fontWeight: 800,
                    color: '#120d0fff'
                  }}>
                    ₱{formatAmount(item.price * item.quantity)}
                  </div>

                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      style={{ 
                        padding: '8px', 
                        borderRadius: '8px', 
                        border: 'none', 
                        background: '#bb8f8fff', 
                        color: '#181616ff', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Remove item"
                    >
                      <FaTrash size={12} />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              onClick={handleAddItem}
              style={{ 
                marginBottom: 16, 
                padding: '12px 16px', 
                borderRadius: 12, 
                background: '#110c0dff', 
                color: '#ff6b93', 
                fontWeight: 'bold', 
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '15px'
              }}
            >
              <FaPlus /> Add Item
            </button>

            {/* Additional Payments Section - Only show for take-out orders */}
            {orderType === 'Take-out' && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ 
                  color: '#181717ff', 
                  marginBottom: 12,
                  fontFamily: 'Arial Rounded MT Bold, sans-serif'
                }}>
                  Additional Payments 
                </h4>
                
                {additionalPayments.map((payment, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    gap: 8, 
                    marginBottom: 12, 
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <input
                      type="text"
                      placeholder="Description (e.g., Tupperware)"
                      value={payment.description}
                      onChange={(e) => handleAdditionalPaymentChange(index, 'description', e.target.value)}
                      style={{ 
                        flex: 2, 
                        padding: '10px', 
                        borderRadius: 12, 
                        border: '2px solid #754752ff',
                        background: '#ddb7bfff',
                        color: '#120f10ff',
                        minWidth: '150px'
                      }}
                    />
                    
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Amount"
                      value={payment.amount}
                      onChange={(e) => handleAdditionalPaymentChange(index, 'amount', parseFloat(e.target.value) || 0)}
                      style={{ 
                        width: 100, 
                        padding: '10px', 
                        borderRadius: 12, 
                        border: '2px solid #754752ff', 
                        textAlign: 'center',
                        background: '#ddb7bfff',
                        color: '#080708ff'
                      }}
                    />
                    
                    <button
                      onClick={() => handleRemoveAdditionalPayment(index)}
                      style={{ 
                        padding: '10px', 
                        borderRadius: '12', 
                        border: 'none', 
                        background: '#040303ff', 
                        color: '#ff6b93', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Remove additional payment"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={handleAddAdditionalPayment}
                  style={{ 
                    marginBottom: 16, 
                    padding: '10px 14px', 
                    borderRadius: 12, 
                    background: '#0b0a0aff', 
                    color: '#ff6b93', 
                    fontWeight: 'bold', 
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px'
                  }}
                >
                  <FaPlus /> Add Additional Payment
                </button>
              </div>
            )}

            {/* NEW: Payment Information Section */}
            <div style={{ 
              marginBottom: 16,
              padding: '16px',
              backgroundColor: '#ddb7bfff',
              borderRadius: 12,
              border: '2px solid #925a65ff'
            }}>
              <h4 style={{ 
                color: '#181717ff', 
                marginBottom: 12,
                fontFamily: 'Arial Rounded MT Bold, sans-serif'
              }}>
                Payment Information
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                <div>
                  <label style={{ fontWeight: '600', color: '#0f060aff', display: 'block', marginBottom: '4px' }}>
                    Tendered Amount:
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={tenderedAmount}
                    onChange={(e) => setTenderedAmount(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      borderRadius: 12, 
                      border: '2px solid #754752ff', 
                      background: '#f8f9fa',
                      color: '#080708ff',
                      textAlign: 'right',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ fontWeight: '600', color: '#0f060aff', display: 'block', marginBottom: '4px' }}>
                    Change:
                  </label>
                  <div style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: 12, 
                    border: '2px solid #28a745', 
                    background: '#d4edda',
                    color: '#155724',
                    textAlign: 'right',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    ₱{formatAmount(changeAmount)}
                  </div>
                </div>
              </div>
              
              {tenderedAmount && parseFloat(tenderedAmount) < totalAmount && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px', 
                  background: '#f8d7da', 
                  color: '#721c24', 
                  borderRadius: '8px',
                  fontSize: '14px',
                  textAlign: 'center',
                  border: '1px solid #f5c6cb'
                }}>
                  ⚠️ Tendered amount is less than total amount
                </div>
              )}
            </div>

            {/* Total Display - Enhanced visibility */}
            <div style={{ 
              textAlign: 'right', 
              fontWeight: 'bold', 
              fontSize: 18, 
              marginBottom: 16,
              padding: '16px',
              backgroundColor: '#ddb7bfff',
              borderRadius: 12,
              border: '2px solid #925a65ff'
            }}>
              <div style={{ marginBottom: 8, color: '#080707ff' }}>
                Items Total: ₱{formatAmount(itemsTotal)}
              </div>
              
              {additionalPayments.length > 0 && (
                <div style={{ marginBottom: 8, color: '#0b090aff' }}>
                  Additional Payments: ₱{formatAmount(additionalPaymentsTotal)}
                </div>
              )}
              
              <div style={{ 
                borderTop: '2px solid #100b0cff', 
                paddingTop: 8, 
                color: '#140e10ff', 
                fontSize: 20 
              }}>
                Total Amount: ₱{formatAmount(totalAmount)}
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isLoading}
              style={{ 
                background: isLoading ? '#6c757d' : '#0b0809ff', 
                color: '#ff6b93', 
                padding: '12px 24px', 
                border: 'none', 
                borderRadius: 12, 
                fontWeight: 'bold', 
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                width: '100%',
                boxShadow: '0 4px 8px rgba(255, 182, 193, 0.4)',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Processing Order...' : 'Place Order'}
            </button>
          </div>
        </>
      )}

      {/* PRINT RECEIPT SECTION - Only show when order is placed */}
      {isOrderPlaced && lastOrder && (
        <div style={{ 
          maxWidth: 800, 
          margin: '0 auto', 
          background: 'white', 
          padding: 24, 
          borderRadius: 20, 
          boxShadow: '0 8px 20px rgba(168, 49, 49, 0.08)',
          border: '2px solid #a12743ff'
        }}>
          <div ref={printRef} style={{ background: 'white', color: 'black', padding: 20 }}>
            {/* Receipt Header */}
            <div className="receipt-header">
              <h2 style={{ 
                margin: '0 0 5px 0', 
                color: '#000',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                ORDER RECEIPT
              </h2>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                Bit and Bites
              </div>
              <div style={{ 
                background: '#28a745', 
                color: 'white', 
                padding: '4px 12px', 
                borderRadius: '15px', 
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'inline-block',
                marginTop: '5px'
              }}>
                COMPLETED
              </div>
            </div>

            {/* Order Information - Highlighted */}
            <div className="order-info">
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 10, 
                marginBottom: '10px'
              }}>
                <div>
                  <strong style={{ color: '#000', fontSize: '12px' }}>ORDER ID:</strong><br />
                  <span style={{ fontSize: '14px', color: '#333', fontWeight: 'bold' }}>
                    {lastOrder._id || lastOrder.orderId || 'N/A'}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#000', fontSize: '12px' }}>ORDER TYPE:</strong><br />
                  <span style={{ 
                    fontSize: '14px', 
                    color: '#333',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {lastOrder.orderType || 'N/A'}
                  </span>
                </div>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 10,
                marginBottom: '10px'
              }}>
                <div>
                  <strong style={{ color: '#000', fontSize: '12px' }}>DATE:</strong><br />
                  <span style={{ fontSize: '12px', color: '#333' }}>
                    {lastOrder.createdAt ? new Date(lastOrder.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#000', fontSize: '12px' }}>TIME:</strong><br />
                  <span style={{ fontSize: '12px', color: '#333' }}>
                    {lastOrder.createdAt ? new Date(lastOrder.createdAt).toLocaleTimeString() : new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 10
              }}>
                <div>
                  <strong style={{ color: '#000', fontSize: '12px' }}>CASHIER:</strong><br />
                  <span style={{ fontSize: '12px', color: '#333' }}>
                    {lastOrder.createdBy || user?.username || 'N/A'}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#000', fontSize: '12px' }}>PAYMENT METHOD:</strong><br />
                  <span style={{ fontSize: '12px', color: '#333' }}>
                    {lastOrder.paymentMethod || 'Cash'}
                  </span>
                </div>
              </div>

              {/* Status Display */}
              <div style={{ 
                marginTop: '10px',
                padding: '8px',
                background: '#d4edda',
                borderRadius: '6px',
                border: '1px solid #c3e6cb',
                textAlign: 'center'
              }}>
                <strong style={{ color: '#155724', fontSize: '12px' }}>
                  STATUS: {lastOrder.status?.toUpperCase() || 'COMPLETE'}
                </strong>
              </div>
            </div>

            {/* Order Items */}
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ 
                margin: '0 0 10px 0', 
                color: '#000',
                fontSize: '16px',
                borderBottom: '1px solid #ddd',
                paddingBottom: '5px'
              }}>
                ORDER ITEMS:
              </h4>
              <div>
                {lastOrder.items && lastOrder.items.length > 0 ? (
                  lastOrder.items.map((item, idx) => (
                    <div key={idx} className="order-item">
                      <div style={{ flex: 2 }}>
                        <div style={{ fontWeight: '600', color: '#000', fontSize: '14px' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          {item.category} • {item.quantity} × ₱{item.price}
                        </div>
                      </div>
                      <div style={{ 
                        flex: 1, 
                        textAlign: 'right', 
                        fontWeight: '600', 
                        color: '#000',
                        fontSize: '14px'
                      }}>
                        ₱{formatAmount(item.price * item.quantity)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#666', textAlign: 'center', fontSize: '12px' }}>No items</p>
                )}
              </div>
            </div>
            
            {/* Additional Payments */}
            {lastOrder.additionalPayments && lastOrder.additionalPayments.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ 
                  margin: '0 0 10px 0', 
                  color: '#000',
                  fontSize: '16px',
                  borderBottom: '1px solid #ddd',
                  paddingBottom: '5px'
                }}>
                  ADDITIONAL PAYMENTS:
                </h4>
                <div>
                  {lastOrder.additionalPayments.map((payment, idx) => (
                    <div key={idx} className="order-item">
                      <div style={{ flex: 2 }}>
                        <div style={{ fontWeight: '600', color: '#000', fontSize: '14px' }}>
                          {payment.description}
                        </div>
                      </div>
                      <div style={{ 
                        flex: 1, 
                        textAlign: 'right', 
                        fontWeight: '600', 
                        color: '#000',
                        fontSize: '14px'
                      }}>
                        ₱{formatAmount(payment.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* NEW: Payment Information on Receipt */}
            {(lastOrder.tenderedAmount || lastOrder.changeAmount) && (
              <div className="payment-info">
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  color: '#000',
                  fontSize: '14px',
                  borderBottom: '1px solid #ddd',
                  paddingBottom: '3px'
                }}>
                  PAYMENT:
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#333' }}>Tendered:</span>
                  <span style={{ fontSize: '12px', color: '#333', fontWeight: 'bold' }}>
                    ₱{formatAmount(lastOrder.tenderedAmount)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#333' }}>Total:</span>
                  <span style={{ fontSize: '12px', color: '#333', fontWeight: 'bold' }}>
                    ₱{formatAmount(lastOrder.totalAmount)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#000', fontWeight: 'bold' }}>Change:</span>
                  <span style={{ fontSize: '13px', color: '#000', fontWeight: 'bold' }}>
                    ₱{formatAmount(lastOrder.changeAmount)}
                  </span>
                </div>
              </div>
            )}
            
            {/* Total Amount - Highlighted */}
            <div className="order-total">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center'
              }}>
                <div style={{ color: '#000', fontSize: '16px', fontWeight: 'bold' }}>
                  TOTAL AMOUNT:
                </div>
                <div style={{ color: '#000', fontSize: '18px', fontWeight: 'bold' }}>
                  ₱{formatAmount(lastOrder.totalAmount)}
                </div>
              </div>
            </div>
            
            <div className="thank-you">
              <p style={{ margin: '20px 0 0 0', fontSize: '12px' }}>
                Thank you for your order!
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '10px', color: '#999' }}>
                This order will appear in POS Analytics
              </p>
            </div>
          </div>
          
          <button
            onClick={handlePrint}
            style={{ 
              marginTop: 16, 
              padding: '12px 20px', 
              borderRadius: 12, 
              border: 'none', 
              background: '#0b0809ff', 
              color: '#ff6b93', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '16px'
            }}
          >
            <FaPrint /> Print Receipt
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: '#fff',
        borderTop: '1px solid #754752ff',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 0',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
      }}>
        <button 
          onClick={() => navigate('/home')} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <FaHome size={20} color="#374151" />
          <span style={{ fontSize: '10px', color: '#374151' }}>Home</span>
        </button>
        <button 
          onClick={() => navigate('/order', { state: { cartItems: cartItems } })} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            position: 'relative'
          }}
        >
          <FaShoppingCart size={20} color="#7b68ee" />
          <span style={{ fontSize: '10px', color: '#7b68ee' }}>Cart</span>
          {cartItems.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              {cartItems.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => navigate('/add')} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <FaBox size={20} color="#374151" />
          <span style={{ fontSize: '10px', color: '#374151' }}>Inventory</span>
        </button>
        <button 
          onClick={() => navigate('/settingpage')} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <FaCog size={20} color="#374151" />
          <span style={{ fontSize: '10px', color: '#374151' }}>Settings</span>
        </button>
      </div>
    </div>
  );
}