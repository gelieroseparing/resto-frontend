import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTrash, FaPlus, FaMinus, FaHome, FaPrint, FaShoppingCart, FaCog, FaTimes, FaCheck } from 'react-icons/fa';

export default function OrderPage() {
  const { token, user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  // Set initial orderType to 'take-out' instead of default
  const [orderType, setOrderType] = useState('take-out');
  const [items, setItems] = useState([{ category: '', name: '', quantity: 1, price: 0 }]);
  const [menuItems, setMenuItems] = useState([]);
  const [lastOrder, setLastOrder] = useState(null); // store last placed order
  const [cartItems, setCartItems] = useState([]); // Items from cart
  const [additionalPayments, setAdditionalPayments] = useState([]); // Additional payments like tupperware
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const printRef = useRef(); // reference for printable section

  const api = axios.create({
    baseURL: 'http://localhost:5000',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  // Load cart items from navigation state
  useEffect(() => {
    if (location.state?.cartItems) {
      // Filter out any unavailable items from cart
      const availableCartItems = location.state.cartItems.filter(item => item.isAvailable);
      setCartItems(availableCartItems);
      
      if (availableCartItems.length !== location.state.cartItems.length) {
        setError('Some unavailable items were removed from your cart');
        setTimeout(() => setError(''), 3000);
      }
    }
    
    if (location.state?.preselect) {
      const item = location.state.preselect;
      // Check if preselected item is available
      if (item.isAvailable) {
        setItems([{ 
          category: item.category, 
          name: item.name, 
          quantity: 1, 
          price: item.price 
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
      const res = await api.get('/api/items');
      // Filter out unavailable items for the dropdown
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
      } else {
        updated[index].price = 0;
      }
    }

    if (field === 'category') {
      updated[index].name = '';
      updated[index].price = 0;
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
      setTimeout(() => setError(''), 3000);
      return;
    }

    const cartItemsAsOrderItems = cartItems.map(item => ({
      category: item.category,
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    setItems([...items.filter(item => item.name), ...cartItemsAsOrderItems]);
    setCartItems([]); // Clear cart after adding
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

  const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTotalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const additionalPaymentsTotal = additionalPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
  const totalAmount = itemsTotal + additionalPaymentsTotal;

  // Place new order
  const handlePlaceOrder = async () => {
    try {
      const allItems = [...items.filter(item => item.name)];
      
      if (allItems.length === 0) {
        setError('Please add at least one item.');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      // Validate that all items are available
      for (const item of allItems) {
        const menuItem = menuItems.find(m => m.name === item.name);
        if (!menuItem) {
          setError(`Item "${item.name}" is not available or has been removed`);
          setTimeout(() => setError(''), 3000);
          return;
        }
      }
      
      // Create order data with all necessary fields
      const orderData = {
        orderType,
        items: allItems,
        additionalPayments: additionalPayments.filter(p => p.description && p.amount > 0),
        totalAmount: totalAmount,
        subtotal: itemsTotal,
        status: 'complete',
        paymentMethod: 'Cash' // Default payment method
      };
      
      const res = await api.post('/api/orders', orderData);
      setSuccess('Order placed successfully!');
      
      // Save the complete order data for the receipt
      setLastOrder({
        ...res.data,
        // Ensure we have all the fields needed for the receipt
        items: orderData.items,
        additionalPayments: orderData.additionalPayments,
        totalAmount: orderData.totalAmount,
        subtotal: orderData.subtotal,
        paymentMethod: orderData.paymentMethod,
        orderType: orderData.orderType
      });
      
      // Reset the form and cart
      setItems([{ category: '', name: '', quantity: 1, price: 0 }]);
      setCartItems([]);
      setAdditionalPayments([]);
    } catch (err) {
      console.error('Order error:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.error || 'Error placing order';
      setError(errorMsg);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Print order
  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const win = window.open('', '', 'height=600,width=800');
    win.document.write('<html><head><title>Order Receipt</title><style>body { font-family: Arial, sans-serif; padding: 20px; }</style></head><body>');
    win.document.write(printContents);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  // Safe function to format amount with fallback
  const formatAmount = (amount) => {
    return amount ? amount.toFixed(2) : '0.00';
  };

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
            onClick={() => nav('/home')}
          >
            <FaHome />
          </button>
          <h2 style={{ margin: 0, color: '#790707ff', fontFamily: 'Arial Rounded MT Bold, sans-serif' }}>Order Page</h2>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          padding: '12px 16px', 
          background: '#ca9a9aff', 
          color: '#dc2626', 
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
          background: '#ca9a9aff', 
          color: '#166534', 
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
          
          {cartItems.map((item, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px', 
              marginBottom: '8px', 
              backgroundColor: '#dbb5bfff',
              borderRadius: '12px',
              border: '1px solid #790707ff'
            }}>
              <div style={{ flex: 2 }}>
                <div style={{ fontWeight: '600', color: '#170b11ff' }}>{item.name}</div>
                <div style={{ fontSize: '14px', color: '#1b0d11ff' }}>{item.category}</div>
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
                >
                  <FaPlus size={15} color="#ff6b93" />
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
          ))}
          
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

        {/* Order Type */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: '600', color: '#0f060aff' }}><strong>Order Type:</strong></label>
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            style={{ 
              marginLeft: 8, 
              padding: '8px 12px', 
              borderRadius: 12, 
              border: '2px solid #754752ff',
              background: '#ddb7bfff',
              color: '#1e171aff',
              fontWeight: '500'
            }}
          >
            <option value="dine-in">Dine-In</option>
            <option value="take-out">Take-Out</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>

        {/* Items */}
        {items.map((item, index) => {
          const availableItems = item.category
            ? menuItems.filter(m => m.category === item.category)
            : [];

          return (
            <div key={index} style={{ 
              display: 'flex', 
              gap: 8, 
              marginBottom: 12, 
              alignItems: 'center',
              flexWrap: 'wrap'
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
                {[...new Set(menuItems.map(m => m.category))].map((cat) => (
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
                  textAlign: 'center',
                  background: '#ddb7bfff',
                  color: '#211b1eff'
                }}
              />

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
                    background: '#191515ff', 
                    color: '#ff6b93', 
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
        {orderType === 'take-out' && (
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
                  onChange={(e) => handleAdditionalPaymentChange(index, 'amount', parseFloat(e.target.value))}
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
                    borderRadius: 12, 
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
          style={{ 
            background: '#0b0809ff', 
            color: '#ff6b93', 
            padding: '12px 24px', 
            border: 'none', 
            borderRadius: 12, 
            fontWeight: 'bold', 
            cursor: 'pointer',
            fontSize: '16px',
            width: '100%',
            boxShadow: '0 4px 8px rgba(255, 182, 193, 0.4)'
          }}
        >
          Place Order
        </button>
      </div>

      {/* Print Last Order - This will appear when lastOrder is set (after clicking Place Order) */}
      {lastOrder && (
        <div style={{ 
          maxWidth: 800, 
          margin: '0 auto', 
          background: '#ca9a9aff', 
          padding: 24, 
          borderRadius: 20, 
          boxShadow: '0 8px 20px rgba(168, 49, 49, 0.08)',
          border: '2px solid #a12743ff'
        }}>
          <div ref={printRef}>
            <h3 style={{ 
              color: '#0f0c0cff', 
              textAlign: 'center',
              fontFamily: 'Arial Rounded MT Bold, sans-serif',
              marginBottom: '16px'
            }}>
              ORDER RECEIPT
            </h3>
            
            {/* Order Information */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: 16, 
              marginBottom: 16,
              padding: '12px',
              backgroundColor: '#dbb5bfff',
              borderRadius: '12px'
            }}>
              <div>
                <strong style={{ color: '#020102ff' }}>Order ID:</strong><br />
                <span style={{ fontSize: '14px', color: '#0e0a0bff' }}>
                  {lastOrder._id || lastOrder.orderId || 'N/A'}
                </span>
              </div>
              <div>
                <strong style={{ color: '#050404ff' }}>Order Type:</strong><br />
                <span style={{ 
                  fontSize: '14px', 
                  color: '#0c090aff',
                  textTransform: 'capitalize'
                }}>
                  {lastOrder.orderType || 'N/A'}
                </span>
              </div>
            </div>
            
            <div style={{ 
              marginBottom: 16,
              padding: '12px',
              backgroundColor: '#dbb5bfff',
              borderRadius: '12px'
            }}>
              <strong style={{ color: '#060505ff' }}>Date & Time:</strong><br />
              <span style={{ fontSize: '14px', color: '#0a0808ff' }}>
                {lastOrder.createdAt ? new Date(lastOrder.createdAt).toLocaleString() : new Date().toLocaleString()}
              </span>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: 16, 
              marginBottom: 16,
              padding: '12px',
              backgroundColor: '#dbb5bfff',
              borderRadius: '12px'
            }}>
              <div>
                <strong style={{ color: '#020101ff' }}>Cashier:</strong><br />
                <span style={{ fontSize: '14px', color: '#14090cff' }}>
                  {user?.username || 'N/A'}
                </span>
              </div>
              <div>
                <strong style={{ color: '#020102ff' }}>Payment Method:</strong><br />
                <span style={{ fontSize: '14px', color: '#0b0809ff' }}>
                  {lastOrder.paymentMethod || 'Cash'}
                </span>
              </div>
            </div>
            
            {/* Order Items */}
            <h4 style={{ 
              marginTop: 10, 
              marginBottom: 10, 
              color: '#010101ff',
              fontFamily: 'Arial Rounded MT Bold, sans-serif'
            }}>
              Order Items:
            </h4>
            <div style={{ marginTop: 10 }}>
              {lastOrder.items && lastOrder.items.length > 0 ? (
                lastOrder.items.map((item, idx) => (
                  <div key={idx} style={{ 
                    padding: '12px', 
                    borderBottom: '2px dotted #7a3243ff', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: idx % 2 ? '#dbb5bfff' : '#dbb5bfff'
                  }}>
                    <div style={{ flex: 2 }}>
                      <div style={{ fontWeight: '600', color: '#060505ff' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: '#10090bff' }}>
                        {item.category} • {item.quantity} × ₱{item.price}
                      </div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right', fontWeight: '600', color: '#090305ff' }}>
                      ₱{formatAmount(item.price * item.quantity)}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#0d0809ff', textAlign: 'center' }}>No items</p>
              )}
            </div>
            
            {/* Additional Payments */}
            {lastOrder.additionalPayments && lastOrder.additionalPayments.length > 0 && (
              <>
                <h4 style={{ 
                  marginTop: 20, 
                  marginBottom: 10, 
                  color: '#0a0708ff',
                  fontFamily: 'Arial Rounded MT Bold, sans-serif'
                }}>
                  Additional Payments:
                </h4>
                <div style={{ marginTop: 10 }}>
                  {lastOrder.additionalPayments.map((payment, idx) => (
                    <div key={idx} style={{ 
                      padding: '12px', 
                      borderBottom: '2px dotted #754752ff', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: idx % 2 ? '#dbb5bfff' : '#dbb5bfff'
                    }}>
                      <div style={{ flex: 2 }}>
                        <div style={{ fontWeight: '600', color: '#010000ff' }}>{payment.description}</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'right', fontWeight: '600', color: '#050404ff' }}>
                        ₱{formatAmount(payment.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {/* Total Amount - Highlighted */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              fontWeight: 'bold', 
              fontSize: '18px',
              padding: '16px',
              backgroundColor: '#dbb5bfff',
              borderRadius: '12px',
              marginTop: '20px',
              border: '2px solid #c15770ff'
            }}>
              <div style={{ color: '#070607ff' }}>TOTAL AMOUNT:</div>
              <div style={{ color: '#100d0eff', fontSize: '20px' }}>
                ₱{formatAmount(lastOrder.totalAmount)}
              </div>
            </div>
            
            <p style={{ 
              textAlign: 'center', 
              fontStyle: 'italic', 
              marginTop: 20, 
              color: '#010101ff',
              padding: '12px'
            }}>
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
              background: '#020202ff', 
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
          onClick={() => nav('/home')} 
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
          onClick={() => nav('/order', { state: { cartItems: cartItems } })} 
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
              backgroundColor: '#f0f0f0',
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
          onClick={() => nav('/settingpage')} 
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