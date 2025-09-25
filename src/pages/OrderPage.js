import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTrash, FaPlus, FaMinus, FaHome, FaPrint, FaShoppingCart, FaCog, FaTimes, FaCheck } from 'react-icons/fa';

export default function OrderPage() {
  const { token, user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [orderType, setOrderType] = useState('take-out');
  const [items, setItems] = useState([{ name: '', quantity: 1, price: 0 }]);
  const [menuItems, setMenuItems] = useState([]);
  const [lastOrder, setLastOrder] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [additionalPayments, setAdditionalPayments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const printRef = useRef();

  // Create axios instance with auth header
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  // Load cart items from navigation state
  useEffect(() => {
    if (location.state?.cartItems) {
      const availableCartItems = location.state.cartItems.filter(item => item.isAvailable);
      setCartItems(availableCartItems);
      
      if (availableCartItems.length !== location.state.cartItems.length) {
        setError('Some unavailable items were removed from your cart');
        setTimeout(() => setError(''), 3000);
      }
    }
    
    if (location.state?.preselect) {
      const item = location.state.preselect;
      if (item.isAvailable) {
        setItems([{ 
          name: item.name, 
          quantity: 1, 
          price: item.price,
          itemId: item._id
        }]);
      } else {
        setError('Selected item is currently unavailable');
        setTimeout(() => setError(''), 3000);
      }
    }
  }, [location.state]);

  // Load menu items - only available ones
  const loadMenuItems = useCallback(async () => {
    try {
      const res = await api.get('/items');
      const availableItems = res.data.filter(item => item.isAvailable);
      setMenuItems(availableItems);
    } catch (err) {
      console.error('Error loading menu:', err);
      setError('Failed to load menu items');
      setTimeout(() => setError(''), 3000);
    }
  }, [api]);

  useEffect(() => {
    loadMenuItems();
  }, [loadMenuItems]);

  // Add new item row
  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 1, price: 0 }]);
  };

  // Handle change in item selection or quantity
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'name') {
      const found = menuItems.find(m => m.name === value);
      if (found) {
        updated[index].price = found.price;
        updated[index].itemId = found._id;
      } else {
        updated[index].price = 0;
        updated[index].itemId = null;
      }
    }

    setItems(updated);
  };

  // Remove item from order form
  const removeItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated.length === 0 ? [{ name: '', quantity: 1, price: 0 }] : updated);
  };

  // Add cart items to order items
  const addCartToOrder = () => {
    if (cartItems.length === 0) {
      setError('Cart is empty!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const cartItemsAsOrderItems = cartItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      itemId: item._id
    }));

    setItems([...items.filter(item => item.name), ...cartItemsAsOrderItems]);
    setCartItems([]);
    setSuccess('Cart items added to order!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Remove item from cart
  const removeFromCart = (index) => {
    const updatedCart = [...cartItems];
    updatedCart.splice(index, 1);
    setCartItems(updatedCart);
  };

  // Update cart item quantity
  const updateCartQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = [...cartItems];
    updatedCart[index].quantity = newQuantity;
    setCartItems(updatedCart);
  };

  // Add additional payment
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

  const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartTotalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const additionalPaymentsTotal = additionalPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
  const totalAmount = itemsTotal + additionalPaymentsTotal;

  // Place new order
  const handlePlaceOrder = async () => {
    try {
      // Filter out empty items and prepare order items
      const orderItems = items
        .filter(item => item.name && item.itemId)
        .map(item => ({
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }));

      if (orderItems.length === 0) {
        setError('Please add at least one valid item.');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // Create order data
      const orderData = {
        orderType,
        items: orderItems,
        totalAmount: totalAmount,
        createdBy: user?.username || 'Customer'
      };

      const res = await api.post('/orders', orderData);
      setSuccess('Order placed successfully!');
      
      // Save the complete order data for the receipt
      setLastOrder({
        ...res.data.order,
        items: orderItems,
        totalAmount: totalAmount,
        createdBy: user?.username || 'Customer'
      });
      
      // Reset the form and cart
      setItems([{ name: '', quantity: 1, price: 0 }]);
      setCartItems([]);
      setAdditionalPayments([]);
    } catch (err) {
      console.error('Order error:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.error || 'Error placing order';
      setError(errorMsg);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Print order receipt
  const handlePrint = () => {
    if (!lastOrder) return;
    
    const printContents = printRef.current.innerHTML;
    const win = window.open('', '', 'height=600,width=800');
    win.document.write(`
      <html>
        <head>
          <title>Order Receipt</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              max-width: 400px;
              margin: 0 auto;
            }
            .receipt-header { text-align: center; margin-bottom: 20px; }
            .receipt-item { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .receipt-total { border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: '#790707ff' }}>

      {/* Top Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        background: '#ca9a9aff',
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
            onClick={() => nav('/home')}
          >
            <FaHome />
          </button>
          <h2 style={{ margin: 0, color: '#fff', fontFamily: 'Arial Rounded MT Bold, sans-serif' }}>Order Page</h2>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          padding: '12px 16px', 
          background: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '8px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
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
          gap: '8px'
        }}>
          <FaCheck /> {success}
        </div>
      )}

      {/* Cart Items Section */}
      {cartItems.length > 0 && (
        <div style={{ 
          background: '#ca9a9aff', 
          padding: 24, 
          borderRadius: 20, 
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)', 
          maxWidth: 800, 
          margin: '0 auto', 
          marginBottom: 20
        }}>
          <h3 style={{ 
            color: '#fff', 
            marginBottom: 16, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaShoppingCart /> Cart Items ({cartItems.length})
            </span>
            <span>Total: ₱{formatAmount(cartTotalAmount)}</span>
          </h3>
          
          {cartItems.map((item, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px', 
              marginBottom: '8px', 
              backgroundColor: '#dbb5bfff',
              borderRadius: '12px'
            }}>
              <div style={{ flex: 2 }}>
                <div style={{ fontWeight: '600', color: '#333' }}>{item.name}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>{item.category}</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => updateCartQuantity(index, item.quantity - 1)}
                  style={{ 
                    padding: '6px', 
                    borderRadius: '8px', 
                    border: '1px solid #790707ff', 
                    background: '#fff', 
                    cursor: 'pointer'
                  }}
                >
                  <FaMinus size={12} />
                </button>
                
                <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '700' }}>
                  {item.quantity}
                </span>
                
                <button
                  onClick={() => updateCartQuantity(index, item.quantity + 1)}
                  style={{ 
                    padding: '6px', 
                    borderRadius: '8px', 
                    border: '1px solid #790707ff', 
                    background: '#fff', 
                    cursor: 'pointer'
                  }}
                >
                  <FaPlus size={12} />
                </button>
              </div>
              
              <div style={{ minWidth: '70px', textAlign: 'right', fontWeight: '600' }}>
                ₱{formatAmount(item.price * item.quantity)}
              </div>
              
              <button
                onClick={() => removeFromCart(index)}
                style={{ 
                  padding: '8px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  background: '#dc3545', 
                  color: 'white', 
                  cursor: 'pointer'
                }}
              >
                <FaTrash size={12} />
              </button>
            </div>
          ))}
          
          <button
            onClick={addCartToOrder}
            style={{ 
              marginTop: '16px', 
              padding: '12px 16px', 
              borderRadius: '12px', 
              border: 'none', 
              background: '#28a745', 
              color: 'white', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              width: '100%'
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
        marginBottom: 40
      }}>
        <h3 style={{ color: '#fff', marginBottom: 16 }}>Customer Order Entry</h3>

        {/* Order Type */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: '600', color: '#fff' }}>Order Type:</label>
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            style={{ 
              marginLeft: 8, 
              padding: '8px 12px', 
              borderRadius: 12, 
              border: '2px solid #754752ff',
              background: '#fff'
            }}
          >
            <option value="dine-in">Dine-In</option>
            <option value="take-out">Take-Out</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>

        {/* Items */}
        {items.map((item, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            gap: 8, 
            marginBottom: 12, 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <select
              value={item.name}
              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
              style={{ 
                flex: 2, 
                padding: '10px', 
                borderRadius: 12, 
                border: '2px solid #754752ff',
                background: '#fff',
                minWidth: '200px'
              }}
            >
              <option value="">-- Select Item --</option>
              {menuItems.map((m) => (
                <option key={m._id} value={m.name}>
                  {m.name} - ₱{m.price}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
              style={{ 
                width: 70, 
                padding: '10px', 
                borderRadius: 12, 
                border: '2px solid #754752ff', 
                textAlign: 'center'
              }}
            />

            <div style={{ minWidth: 90, textAlign: 'right', fontWeight: 800, color: '#fff' }}>
              ₱{formatAmount(item.price * item.quantity)}
            </div>

            {items.length > 1 && (
              <button
                onClick={() => removeItem(index)}
                style={{ 
                  padding: '8px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  background: '#dc3545', 
                  color: 'white', 
                  cursor: 'pointer'
                }}
              >
                <FaTrash size={12} />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={handleAddItem}
          style={{ 
            marginBottom: 16, 
            padding: '12px 16px', 
            borderRadius: 12, 
            background: '#007bff', 
            color: 'white', 
            fontWeight: 'bold', 
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FaPlus /> Add Item
        </button>

        {/* Total Display */}
        <div style={{ 
          textAlign: 'right', 
          fontWeight: 'bold', 
          fontSize: 18, 
          marginBottom: 16,
          padding: '16px',
          backgroundColor: '#dbb5bfff',
          borderRadius: 12,
          border: '2px solid #925a65ff'
        }}>
          <div style={{ marginBottom: 8, color: '#333' }}>
            Items Total: ₱{formatAmount(itemsTotal)}
          </div>
          
          {additionalPayments.length > 0 && (
            <div style={{ marginBottom: 8, color: '#333' }}>
              Additional Payments: ₱{formatAmount(additionalPaymentsTotal)}
            </div>
          )}
          
          <div style={{ borderTop: '2px solid #333', paddingTop: 8, color: '#333', fontSize: 20 }}>
            Total Amount: ₱{formatAmount(totalAmount)}
          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          style={{ 
            background: '#28a745', 
            color: 'white', 
            padding: '12px 24px', 
            border: 'none', 
            borderRadius: 12, 
            fontWeight: 'bold', 
            cursor: 'pointer',
            fontSize: '16px',
            width: '100%'
          }}
        >
          Place Order
        </button>
      </div>

      {/* Print Last Order Receipt */}
      {lastOrder && (
        <div style={{ 
          maxWidth: 800, 
          margin: '0 auto', 
          background: '#fff', 
          padding: 24, 
          borderRadius: 20, 
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
        }}>
          <div ref={printRef}>
            <h3 style={{ textAlign: 'center', marginBottom: '16px', color: '#333' }}>
              ORDER RECEIPT
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <strong>Order ID:</strong> {lastOrder._id?.slice(-6) || 'N/A'}<br />
              <strong>Date:</strong> {new Date(lastOrder.createdAt || Date.now()).toLocaleString()}<br />
              <strong>Order Type:</strong> {lastOrder.orderType}<br />
              <strong>Cashier:</strong> {lastOrder.createdBy}
            </div>
            
            <h4 style={{ marginTop: 10, marginBottom: 10 }}>Order Items:</h4>
            <div style={{ marginTop: 10 }}>
              {lastOrder.items && lastOrder.items.map((item, idx) => (
                <div key={idx} style={{ 
                  padding: '8px', 
                  borderBottom: '1px solid #ddd', 
                  display: 'flex', 
                  justifyContent: 'space-between'
                }}>
                  <div>
                    {item.name} × {item.quantity}
                  </div>
                  <div>₱{formatAmount(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              fontWeight: 'bold', 
              fontSize: '18px',
              padding: '16px',
              borderTop: '2px solid #333',
              marginTop: '20px'
            }}>
              <div>TOTAL AMOUNT:</div>
              <div>₱{formatAmount(lastOrder.totalAmount)}</div>
            </div>
            
            <p style={{ textAlign: 'center', fontStyle: 'italic', marginTop: 20 }}>
              Thank you for your order!
            </p>
          </div>
          
          <button
            onClick={handlePrint}
            style={{ 
              marginTop: 16, 
              padding: '12px 20px', 
              borderRadius: 12, 
              border: 'none', 
              background: '#007bff', 
              color: 'white', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
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
        borderTop: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 0'
      }}>
        <button onClick={() => nav('/home')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <FaHome size={20} color="#374151" />
        </button>
        <button onClick={() => nav('/order', { state: { cartItems: cartItems } })} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
          <FaShoppingCart size={20} color="#374151" />
          {cartItems.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: '#dc3545',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px'
            }}>
              {cartItems.length}
            </span>
          )}
        </button>
        <button onClick={() => nav('/settingpage')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <FaCog size={20} color="#374151" />
        </button>
      </div>
    </div>
  );
}