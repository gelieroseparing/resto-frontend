import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaShoppingCart, FaCog, FaPlus, FaShoppingBasket, FaStar, FaSearch, FaEyeSlash } from 'react-icons/fa';

export default function HomePage() {
  const { token, user } = useAuth();
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [soldOutCount, setSoldOutCount] = useState(0);
  const [bestFood, setBestFood] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Create axios instance with auth header
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  const categories = ['All', 'Drinks', 'Breakfast', 'Dessert', 'Lunch', 'Dinner', 'Snack'];

  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/items');
      const allItems = res.data;
      setItems(allItems);

      // Calculate unavailable items
      const unavailableItems = allItems.filter(item => !item.isAvailable);
      setSoldOutCount(unavailableItems.length);

      // Find the best rated available item
      const availableItems = allItems.filter(item => item.isAvailable);
      if (availableItems.length > 0) {
        const best = availableItems.reduce((prev, current) => {
          return (prev.rating || 0) > (current.rating || 0) ? prev : current;
        });
        setBestFood(best.rating ? best : availableItems[0]);
      } else {
        setBestFood(null);
      }
    } catch (err) {
      console.error('Failed to load items', err);
    }
  }, [api]);

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category === 'All' ? null : category);
  };

  // Add item to cart
  const addToCart = (item, e) => {
    if (e) e.stopPropagation();
    
    // Check if item is available
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
    
    // Show feedback that item was added
    const notification = document.createElement('div');
    notification.textContent = `Added ${item.name} to cart!`;
    notification.style.position = 'fixed';
    notification.style.top = '20px'; // Fixed: removed colon
    notification.style.right = '20px'; // Fixed: removed colon
    notification.style.backgroundColor = '#10b981';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '10px';
    notification.style.zIndex = '1000';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 2000);
  };

  // Filter items based on selected category and search query
  const filteredItems = (selectedCategory
    ? items.filter(it => it.category === selectedCategory)
    : items
  ).filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get profile image URL
  const getProfileImageUrl = () => {
    if (user?.profileImage) {
      if (user.profileImage.startsWith('http')) {
        return user.profileImage;
      }
      return `http://localhost:5000${user.profileImage}`;
    }
    return '/profile.jpg';
  };

  // Improved image error handling
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    const fallback = e.target.nextSibling;
    if (fallback && fallback.style) {
      fallback.style.display = 'flex';
    }
  };

  return (
    <div style={{
      padding: '20px 16px 70px',
      minHeight: '100vh',
      background: '#790707ff',
      fontFamily: "'Arial', sans-serif",
      color: '#fff'
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
            color: '#fff', 
            fontWeight: '800', 
            margin: 0
          }}>Restaurant POS</h1>
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
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '10px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => nav('/order', { state: { cartItems: cart } })}
          >
            <FaShoppingBasket size={24} color="#fff" />
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
                {cart.reduce((total, item) => total + item.quantity, 0)}
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
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
            onClick={() => nav('/profile')}
          >
            <img 
              src={getProfileImageUrl()} 
              alt="Profile" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover' 
              }}
              onError={handleImageError}
            />
            <span style={{ 
              display: 'none', 
              color: '#333', 
              fontWeight: 'bold', 
              fontSize: '18px'
            }}>
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
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
            backgroundColor: 'rgba(255,255,255,0.9)',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <FaSearch style={{
          position: 'absolute',
          left: '15px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#666'
        }} />
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
              color: selectedCategory === (cat === 'All' ? null : cat) ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              flexShrink: 0
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
          background: 'rgba(255,255,255,0.9)',
          padding: '15px',
          borderRadius: '18px',
          minWidth: '140px',
          textAlign: 'center',
          flexShrink: 0
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#333' }}>Unavailable</h3>
          <p style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#dc3545' }}>{soldOutCount}</p>
        </div>
        
        {/* Best Food */}
        {bestFood && (
          <div style={{
            background: 'rgba(255,255,255,0.9)',
            padding: '15px',
            borderRadius: '18px',
            minWidth: '140px',
            textAlign: 'center',
            flexShrink: 0
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#333' }}>Featured</h3>
            {bestFood.rating && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <FaStar color="#ffc107" />
                <p style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#333' }}>
                  {bestFood.rating.toFixed(1)}
                </p>
              </div>
            )}
            <p style={{ fontSize: '12px', margin: '5px 0 0', color: '#666', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
              overflow: 'hidden',
              cursor: it.isAvailable ? 'pointer' : 'not-allowed',
              position: 'relative',
              opacity: it.isAvailable ? 1 : 0.7,
              transition: 'transform 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onClick={() => {
              if (it.isAvailable) {
                nav('/order', { state: { preselect: it } });
              }
            }}
            onMouseEnter={(e) => {
              if (it.isAvailable) {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (it.isAvailable) {
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <div style={{ 
              position: 'relative',
              height: '140px',
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
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
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
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <FaEyeSlash size={10} /> Unavailable
                </div>
              )}
              
              {/* Add to Cart Button */}
              <button
                onClick={(e) => addToCart(it, e)}
                disabled={!it.isAvailable}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  backgroundColor: !it.isAvailable ? '#ccc' : '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: !it.isAvailable ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (it.isAvailable) {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <FaPlus size={12} />
              </button>
            </div>
            <div style={{ padding: '12px' }}>
              <h4 style={{ 
                margin: '0 0 4px', 
                fontWeight: '700', 
                fontSize: '14px',
                color: !it.isAvailable ? '#999' : '#000',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>{it.name}</h4>
              <p style={{ 
                margin: '0 0 6px', 
                fontSize: '11px', 
                color: !it.isAvailable ? '#bbb' : '#666',
                fontWeight: '600'
              }}>{it.category}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ 
                  margin: 0, 
                  fontWeight: '800', 
                  color: !it.isAvailable ? '#bbb' : '#333',
                  fontSize: '15px'
                }}>₱{parseFloat(it.price).toFixed(2)}</p>
                {it.rating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', color: '#ffc107' }}>
                    <FaStar size={10} />
                    <span>{it.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#fff' }}>
          <p style={{ fontSize: '18px', fontWeight: '600' }}>No items found</p>
          <p style={{ fontSize: '14px' }}>Try a different search or category</p>
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
        padding: '12px 0',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
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
          <FaHome size={20} color="#007bff" />
          <span style={{ fontSize: '10px', color: '#007bff' }}>Home</span>
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
              backgroundColor: '#dc3545',
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
              {cart.reduce((total, item) => total + item.quantity, 0)}
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