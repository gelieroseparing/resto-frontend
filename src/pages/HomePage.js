import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaShoppingCart, FaCog, FaPlus, FaShoppingBasket, FaStar, FaSearch, FaEyeSlash } from 'react-icons/fa';

export default function HomePage() {
  const { token, user } = useAuth();
  const nav = useNavigate();
  const printRef = useRef(); // added for print functionality

  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [soldOutCount, setSoldOutCount] = useState(0);
  const [bestFood, setBestFood] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const api = axios.create({
    baseURL: 'http://localhost:5000',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  const categories = ['All', 'Drinks', 'Breakfast', 'Dessert', 'Lunch', 'Dinner', 'Snack'];

  // ✅ fetch both items and orders
  const loadData = useCallback(async () => {
    try {
      const [itemsRes, ordersRes] = await Promise.all([
        api.get("/api/items"),
        api.get("/api/orders")
      ]);

      setItems(itemsRes.data);
      setOrders(ordersRes.data);

      // sold out + best food (same as before)
      const soldOutItems = itemsRes.data.filter(item => item.stock === 0);
      setSoldOutCount(soldOutItems.length);

      const availableItems = itemsRes.data.filter(item => item.isAvailable);
      const best = availableItems.reduce((prev, current) => {
        return (prev.rating || 0) > (current.rating || 0) ? prev : current;
      }, {});
      setBestFood(best);

    } catch (err) {
      console.error("Failed to load data", err);
    }
  }, [api]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category === 'All' ? null : category);
  };

  // Add item to cart
  const addToCart = (item, e) => {
    e.stopPropagation();
    
    if (!item.isAvailable) {
      const notification = document.createElement('div');
      notification.textContent = `${item.name} is currently unavailable!`;
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.right = '20px';
      notification.style.backgroundColor = '#ef4444';
      notification.style.color = 'white';
      notification.style.padding = '10px 20px';
      notification.style.borderRadius = '10px';
      notification.style.zIndex = '1000';
      notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 2000);
      return;
    }
    
    const existingItem = cart.find(cartItem => cartItem._id === item._id);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem._id === item._id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 } 
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    
    const notification = document.createElement('div');
    notification.textContent = `Added ${item.name} to cart!`;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#223dc5ff';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '10px';
    notification.style.zIndex = '1000';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 2000);
  };

  // Filter items based on category and search
  const filteredItems = (selectedCategory
    ? items.filter(it => it.category === selectedCategory)
    : items
  ).filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      padding: '20px 16px 70px',
      minHeight: '100vh',
      background: '#790707ff',
      fontFamily: "'New Times Roman', sans-serif",
      color: '#1a191dff'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '0 4px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '1.8rem', 
            color: '#e2e0ebff', 
            fontWeight: '800', 
            margin: 0,
            fontFamily: "'Pacifico', cursive"
          }}> Restaurant</h1>
          <p style={{ 
            margin: 0, 
            color: '#e6dedeff', 
            fontSize: '0.9rem',
            marginTop: '4px'
          }}>Delicious food awaits!</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Cart Icon with Badge */}
          <div 
            style={{ 
              position: 'relative', 
              cursor: 'pointer',
              backgroundColor: 'rgba(206, 191, 191, 0.7)',
              padding: '10px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onClick={() => nav('/order', { state: { cartItems: cart } })}
          >
            <FaShoppingBasket size={30} color="#2559dbff" />
            {cart.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: '#ff6b6b',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                {cart.length}
              </span>
            )}
          </div>
          
          {/* Profile Image */}
          <div 
            style={{
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              overflow: 'hidden',
              cursor: 'pointer',
              border: '3px solid #ff6b93',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => nav('/profile')}
          >
            {user?.profileImage ? (
              <img 
                src={
                  user.profileImage.startsWith('http') 
                    ? user.profileImage 
                    : `http://localhost:5000${user.profileImage}`
                } 
                alt="Profile" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover' 
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <span style={{ color: '#0a090dff', fontWeight: 'bold', fontSize: '18px' }}>
                {user?.name?.charAt(0) || 'U'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{
        position: 'relative',
        marginBottom: '20px'
      }}>
        <input
          type="text"
          placeholder="Search food or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 40px',
            borderRadius: '25px',
            border: 'none',
            backgroundColor: 'rgba(255,255,255,0.8)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontSize: '14px'
          }}
        />
        <FaSearch 
          style={{
            position: 'absolute',
            left: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#585353ff'
          }} 
        />
      </div>

      {/* Category Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px', 
        overflowX: 'auto',
        paddingBottom: '5px'
      }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: selectedCategory === (cat === 'All' ? null : cat) ? '#ff6b93' : 'rgba(255,255,255,0.8)',
              color: selectedCategory === (cat === 'All' ? null : cat) ? '#fff' : '#030503ff',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '25px',
        overflowX: 'auto',
        paddingBottom: '5px'
      }}>
        {/* Sold Out Items */}
        <div style={{
          background: 'rgba(255,255,255,0.7)',
          padding: '15px',
          borderRadius: '18px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          minWidth: '140px',
          textAlign: 'center',
          flexShrink: 0
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#060607ff' }}>Sold Out</h3>
          <p style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#f6f2f2ff' }}>{soldOutCount}</p>
        </div>
        
        {/* Best Food */}
        {bestFood && (
          <div style={{
            background: 'rgba(255,255,255,0.7)',
            padding: '15px',
            borderRadius: '18px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            minWidth: '140px',
            textAlign: 'center',
            flexShrink: 0
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#0e0c15ff' }}>Best Rated</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <FaStar color="#ffc107" />
              <p style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#4a4a4a' }}>
                {bestFood.rating || 'N/A'}
              </p>
            </div>
            <p style={{ fontSize: '12px', margin: '5px 0 0', color: '#0b0a0fff', fontWeight: '600' }}>
              {bestFood.name}
            </p>
          </div>
        )}
      </div>

      {/* Food Items Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '16px',
        padding: '0 4px'
      }}>
        {filteredItems.map(it => (
          <div
            key={it._id}
            style={{
              background: '#fff',
              borderRadius: '18px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: it.isAvailable ? 'pointer' : 'not-allowed',
              position: 'relative',
              opacity: it.isAvailable ? 1 : 0.7
            }}
            onClick={() => {
              if (it.isAvailable) {
                nav('/order', { state: { preselect: it } });
              }
            }}
            onMouseEnter={e => {
              if (it.isAvailable) {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
              }
            }}
            onMouseLeave={e => {
              if (it.isAvailable) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              }
            }}
          >
            <div style={{ 
              position: 'relative',
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f9f7fe'
            }}>
              {it.imageUrl ? (
                <img 
                  src={`http://localhost:5000${it.imageUrl}`} 
                  alt={it.name} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    filter: !it.isAvailable ? 'grayscale(50%)' : 'none'
                  }} 
                />
              ) : (
                <div style={{ 
                  height: '100%', 
                  width: '100%',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#bbb',
                  fontSize: '12px'
                }}>
                  No Image
                </div>
              )}
              
              {/* Unavailable Indicator */}
              {!it.isAvailable && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  backgroundColor: 'rgba(107, 114, 128, 0.9)',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  <FaEyeSlash size={10} style={{ marginRight: '4px' }} />
                  Unavailable
                </div>
              )}
              
              {/* Sold Out Indicator */}
              {it.stock === 0 && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: 'rgba(255,107,107,0.9)',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>Sold Out</div>
              )}
              
              {/* Add to Cart Button */}
              <button
                onClick={(e) => addToCart(it, e)}
                disabled={it.stock === 0 || !it.isAvailable}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  backgroundColor: it.stock === 0 || !it.isAvailable ? '#ccc' : '#7b68ee',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: it.stock === 0 || !it.isAvailable ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  zIndex: 10,
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={e => {
                  if (it.stock !== 0 && it.isAvailable) {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title={it.stock === 0 ? 'Out of stock' : !it.isAvailable ? 'Unavailable' : 'Add to cart'}
              >
                <FaPlus size={12} />
              </button>
            </div>
            <div style={{ padding: '12px' }}>
              <h4 style={{ 
                margin: '0 0 4px', 
                fontWeight: '700', 
                fontSize: '14px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: !it.isAvailable ? '#999' : '#000'
              }}>{it.name}</h4>
              <p style={{ 
                margin: '0 0 6px', 
                fontSize: '11px', 
                color: !it.isAvailable ? '#bbb' : '#050407ff', 
                fontWeight: '600' 
              }}>{it.category}</p>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <p style={{ 
                  margin: 0, 
                  fontWeight: '800', 
                  color: !it.isAvailable ? '#bbb' : '#4a4a4a',
                  fontSize: '15px'
                }}>₱{it.price}</p>
                {it.rating && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '2px',
                    fontSize: '11px',
                    color: '#ffc107'
                  }}>
                    <FaStar size={10} />
                    <span>{it.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#edebf5ff'
        }}>
          <p style={{ fontSize: '18px', fontWeight: '600' }}>No items found</p>
          <p style={{ fontSize: '14px' }}>Try a different search or category</p>
        </div>
      )}

      {/* Recent Orders Section */}
      <div style={{ marginTop: "40px" }}>
        <h2 style={{ color: "#fff", marginBottom: "10px" }}>Recent Orders</h2>
        {orders.length === 0 ? (
          <p style={{ color: "#ddd" }}>No orders found</p>
        ) : (
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "12px" 
          }}>
            {orders.map(order => (
              <div key={order._id} style={{
                background: "rgba(255,255,255,0.8)",
                padding: "12px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <p style={{ margin: 0, fontWeight: "600", color: "#111" }}>
                  {order.user?.name || "Unknown User"}
                </p>
                <p style={{ margin: "4px 0", fontSize: "13px", color: "#333" }}>
                  {new Date(order.createdAt).toLocaleString()}
                </p>
                <ul style={{ margin: "8px 0 0", paddingLeft: "16px", color: "#444" }}>
                  {order.items.map(it => (
                    <li key={it._id}>
                      {it.item?.name} × {it.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: '#fff',
        borderTop: '1px solid #f0f0f0',
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
          <FaHome size={20} color="#7b68ee" />
          <span style={{ fontSize: '10px', color: '#7b68ee' }}>Home</span>
        </button>
        <button 
          onClick={() => nav('/order', { state: { cartItems: cart } })} 
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
          <FaShoppingCart size={20} color="#374151" />
          <span style={{ fontSize: '10px', color: '#374151' }}>Cart</span>
          {cart.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: '#ff6b6b',
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
              {cart.length}
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