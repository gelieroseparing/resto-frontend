import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaShoppingCart, FaCog, FaPlus, FaShoppingBasket, FaStar, FaSearch, FaEyeSlash, FaUser, FaClock, FaBox, FaEye, FaFilter } from 'react-icons/fa';

export default function HomePage() {
  const { token, user } = useAuth();
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [soldOutCount, setSoldOutCount] = useState(0);
  const [latestFood, setLatestFood] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  // Create axios instance with baseURL
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {} 
  });

  const categories = ['All', 'Drinks', 'Breakfast', 'Dessert', 'Lunch', 'Dinner', 'Snack'];

  // Improved function to get food item image URL - similar to MenuPage
  const getImageUrl = useCallback((imageUrl) => {
    if (!imageUrl) return null;
    
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Handle different path formats
    let imagePath = imageUrl;
    
    // Remove leading slash if present to avoid double slashes
    if (imagePath.startsWith('/')) {
      imagePath = imagePath.slice(1);
    }
    
    // Remove 'uploads/' prefix if already present to avoid duplication
    if (imagePath.startsWith('uploads/')) {
      imagePath = imagePath.replace('uploads/', '');
    }
    
    // Construct the full URL - ensure proper path structure
    const fullUrl = `${baseUrl}/uploads/${imagePath}`;
    
    return fullUrl;
  }, []);

  // Get cached image URL with fallback - similar to MenuPage
  const getCachedImageUrl = async (imageUrl) => {
    if (!imageUrl) return null;
    
    const fullUrl = getImageUrl(imageUrl);
    
    try {
      const imageCache = await caches.open('menu-images');
      const cachedResponse = await imageCache.match(fullUrl);
      
      if (cachedResponse) {
        return URL.createObjectURL(await cachedResponse.blob());
      }
    } catch (err) {
      console.log('Cache access error:', err);
    }
    
    return fullUrl;
  };

  // Improved image error handling with caching - similar to MenuPage
  const handleImageError = async (e, item) => {
    console.log(`HomePage - Image failed to load:`, e.target.src);
    console.log(`Item: ${item.name}`);
    
    try {
      // Try to get from cache first
      const cachedUrl = await getCachedImageUrl(item.imageUrl);
      if (cachedUrl && cachedUrl !== e.target.src) {
        console.log('HomePage - Trying cached URL:', cachedUrl);
        e.target.src = cachedUrl;
        return;
      }
      
      // If cache fails, try alternative URL construction
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      let testPath = item.imageUrl;
      
      // Try different path variations
      const pathVariations = [
        testPath,
        testPath.startsWith('/') ? testPath.slice(1) : `/${testPath}`,
        testPath.startsWith('uploads/') ? testPath : `uploads/${testPath}`,
        testPath.startsWith('/uploads/') ? testPath.slice(1) : testPath
      ];
      
      for (const variation of pathVariations) {
        const testUrl = `${baseUrl}/${variation}`;
        if (testUrl !== e.target.src) {
          console.log('HomePage - Testing alternative URL:', testUrl);
          
          const testImg = new Image();
          testImg.onload = () => {
            console.log('HomePage - Alternative URL works!');
            e.target.src = testUrl;
            
            // Cache this working URL
            caches.open('menu-images').then(cache => {
              fetch(testUrl).then(response => {
                if (response.ok) {
                  cache.put(testUrl, response);
                }
              });
            });
          };
          testImg.onerror = () => {
            console.log('HomePage - Alternative URL failed:', testUrl);
          };
          testImg.src = testUrl;
          break;
        }
      }
    } catch (err) {
      console.log('HomePage - All image loading attempts failed');
      // Show fallback
      e.target.style.display = 'none';
      const fallback = e.target.nextSibling;
      if (fallback) {
        fallback.style.display = 'flex';
      }
    }
  };

  // Preload images when component mounts - similar to MenuPage
  const preloadImages = useCallback(async (items) => {
    const imageCache = await caches.open('menu-images');
    
    items.forEach(async (item) => {
      if (item.imageUrl) {
        const imageUrl = getImageUrl(item.imageUrl);
        try {
          // Check if image is already cached
          const cached = await imageCache.match(imageUrl);
          if (!cached) {
            // Preload and cache the image
            const response = await fetch(imageUrl, { mode: 'cors' });
            if (response.ok) {
              await imageCache.put(imageUrl, response);
              console.log('Preloaded and cached image:', imageUrl);
            }
          }
        } catch (err) {
          console.log('Preloading failed for:', imageUrl, err);
        }
      }
    });
  }, [getImageUrl]);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/items');
      const allItems = res.data;
      
      // Sort items by creation date (newest first)
      const sortedItems = allItems.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setItems(sortedItems);

      // Preload images for all items
      preloadImages(sortedItems);

      // Calculate unavailable items
      const unavailableItems = sortedItems.filter(item => !item.isAvailable);
      setSoldOutCount(unavailableItems.length);

      // Find the latest added item (most recent createdAt)
      if (sortedItems.length > 0) {
        const latest = sortedItems
          .filter(item => item.isAvailable)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        setLatestFood(latest);
      } else {
        setLatestFood(null);
      }
    } catch (err) {
      console.error('Failed to load items', err);
    }
  }, [api, preloadImages]);

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category === 'All' ? null : category);
  };

  // Handle availability filter
  const handleAvailabilityFilter = (filter) => {
    setAvailabilityFilter(filter);
  };

  // Add item to cart
  const addToCart = (item, e) => {
    if (e) e.stopPropagation();
    
    // Check if item is available
    if (!item.isAvailable) {
      showNotification(`${item.name} is currently unavailable!`, 'error');
      return;
    }

    // Check stock availability
    if ((item.stock || 0) <= 0) {
      showNotification(`${item.name} is out of stock!`, 'error');
      return;
    }
    
    const existingItem = cart.find(cartItem => cartItem._id === item._id);
    
    if (existingItem) {
      // Check if adding more would exceed stock
      if (existingItem.quantity + 1 > (item.stock || 0)) {
        showNotification(`Cannot add more ${item.name}. Only ${item.stock} available!`, 'error');
        return;
      }
      
      setCart(cart.map(cartItem => 
        cartItem._id === item._id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 } 
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    
    showNotification(`Added ${item.name} to cart!`, 'success');
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '10px';
    notification.style.zIndex = '1000';
    notification.style.fontWeight = '500';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 2000);
  };

  // Filter items based on selected category, search query, and availability filter
  const filteredItems = (selectedCategory
    ? items.filter(it => it.category === selectedCategory)
    : items
  ).filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  ).filter(item => {
    if (availabilityFilter === 'available') return item.isAvailable;
    if (availabilityFilter === 'unavailable') return !item.isAvailable;
    return true;
  });

  // Get profile image URL
  const getProfileImageUrl = useCallback(() => {
    if (user?.profileImage) {
      if (user.profileImage.startsWith('http')) {
        return user.profileImage;
      }
      const imagePath = user.profileImage.startsWith('/') ? user.profileImage.slice(1) : user.profileImage;
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${imagePath}`;
    }
    return '/profile.jpg';
  }, [user?.profileImage]);

  // Format date to show how recent the item is
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
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
          }}>Bits and Bites Resto</h1>
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
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '25px',
              transition: 'all 0.3s ease'
            }}
            onClick={() => nav('/profile')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid #ff6b93',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <img 
                src={getProfileImageUrl()} 
                alt="Profile" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover' 
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextSibling;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div style={{ 
                display: 'none', 
                width: '100%',
                height: '100%',
                backgroundColor: '#ff6b93',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#fff',
                lineHeight: '1.2'
              }}>
                {user?.username || 'User'}
              </span>
              <span style={{ 
                fontSize: '12px', 
                color: '#ff6b93', 
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <FaUser size={10} />
                {user?.position || 'Staff'}
              </span>
            </div>
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

      {/* Availability Filter Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => handleAvailabilityFilter('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            backgroundColor: availabilityFilter === 'all' ? '#007bff' : 'rgba(255,255,255,0.8)',
            color: availabilityFilter === 'all' ? '#fff' : '#333',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FaFilter size={12} /> All
        </button>
        <button
          onClick={() => handleAvailabilityFilter('available')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            backgroundColor: availabilityFilter === 'available' ? '#28a745' : 'rgba(255,255,255,0.8)',
            color: availabilityFilter === 'available' ? '#fff' : '#333',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FaEye size={12} /> Available
        </button>
        <button
          onClick={() => handleAvailabilityFilter('unavailable')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            backgroundColor: availabilityFilter === 'unavailable' ? '#dc3545' : 'rgba(255,255,255,0.8)',
            color: availabilityFilter === 'unavailable' ? '#fff' : '#333',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FaEyeSlash size={12} /> Unavailable
        </button>
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
        
        {/* Available Items */}
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          padding: '15px',
          borderRadius: '18px',
          minWidth: '140px',
          textAlign: 'center',
          flexShrink: 0
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#333' }}>Available</h3>
          <p style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#28a745' }}>
            {items.filter(item => item.isAvailable).length}
          </p>
        </div>
        
        {/* Total Stock */}
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          padding: '15px',
          borderRadius: '18px',
          minWidth: '140px',
          textAlign: 'center',
          flexShrink: 0
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#333' }}>Total Stock</h3>
          <p style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#007bff' }}>
            {items.reduce((total, item) => total + (item.stock || 0), 0)}
          </p>
        </div>
        
        {/* Latest Food */}
        {latestFood && (
          <div style={{
            background: 'rgba(255,255,255,0.9)',
            padding: '15px',
            borderRadius: '18px',
            minWidth: '140px',
            textAlign: 'center',
            flexShrink: 0,
            cursor: 'pointer'
          }}
          onClick={() => {
            if (latestFood.isAvailable) {
              nav('/order', { state: { preselect: latestFood } });
            }
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <FaClock size={12} /> Latest
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
              {latestFood.rating > 0 && (
                <>
                  <FaStar color="#ffc107" size={12} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                    {latestFood.rating.toFixed(1)}
                  </span>
                </>
              )}
            </div>
            <p style={{ fontSize: '12px', margin: '0', color: '#666', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {latestFood.name}
            </p>
            <p style={{ fontSize: '10px', margin: '4px 0 0', color: '#999' }}>
              {getTimeAgo(latestFood.createdAt)}
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
        {filteredItems.map(it => {
          const itemImageUrl = getImageUrl(it.imageUrl);
          const isOutOfStock = (it.stock || 0) <= 0;
          
          return (
            <div
              key={it._id}
              style={{
                background: '#fff',
                borderRadius: '18px',
                overflow: 'hidden',
                cursor: it.isAvailable && !isOutOfStock ? 'pointer' : 'not-allowed',
                position: 'relative',
                opacity: it.isAvailable && !isOutOfStock ? 1 : 0.7,
                transition: 'transform 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onClick={() => {
                if (it.isAvailable && !isOutOfStock) {
                  nav('/order', { state: { preselect: it } });
                }
              }}
              onMouseEnter={(e) => {
                if (it.isAvailable && !isOutOfStock) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (it.isAvailable && !isOutOfStock) {
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ 
                position: 'relative',
                height: '140px',
                backgroundColor: '#f9f7fe'
              }}>
                {itemImageUrl ? (
                  <>
                    <img 
                      src={itemImageUrl} 
                      alt={it.name} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        filter: !it.isAvailable || isOutOfStock ? 'grayscale(50%)' : 'none'
                      }} 
                      onError={(e) => handleImageError(e, it)}
                      loading="lazy"
                    />
                    {/* Fallback for food image */}
                    <div style={{ 
                      display: 'none', 
                      width: '100%', 
                      height: '100%',
                      backgroundColor: '#e0e0e0',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                      fontSize: '12px',
                      fontWeight: '600',
                      textAlign: 'center',
                      padding: '10px'
                    }}>
                      {it.name}
                    </div>
                  </>
                ) : (
                  <div style={{ 
                    height: '100%', 
                    width: '100%',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#bbb',
                    fontSize: '12px',
                    fontWeight: '600',
                    textAlign: 'center',
                    padding: '10px'
                  }}>
                    {it.name}
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
                
                {/* Out of Stock Indicator */}
                {it.isAvailable && isOutOfStock && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    backgroundColor: 'rgba(220, 53, 69, 0.9)',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <FaBox size={10} /> Out of Stock
                  </div>
                )}
                
                {/* Stock Display */}
                {it.isAvailable && !isOutOfStock && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    backgroundColor: 'rgba(34, 197, 94, 0.9)',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <FaBox size={10} /> {it.stock || 0}
                  </div>
                )}
                
                {/* Rating Badge */}
                {it.rating > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(255, 193, 7, 0.9)',
                    color: '#000',
                    padding: '3px 6px',
                    borderRadius: '8px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    ⭐ {it.rating.toFixed(1)}
                  </div>
                )}

                {/* New Item Badge */}
                {it.createdAt && (new Date() - new Date(it.createdAt)) < (24 * 60 * 60 * 1000) && (
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '8px',
                    backgroundColor: 'rgba(34, 197, 94, 0.9)',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <FaClock size={8} /> NEW
                  </div>
                )}
                
                {/* Add to Cart Button */}
                <button
                  onClick={(e) => addToCart(it, e)}
                  disabled={!it.isAvailable || isOutOfStock}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    backgroundColor: (!it.isAvailable || isOutOfStock) ? '#ccc' : '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (!it.isAvailable || isOutOfStock) ? 'not-allowed' : 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (it.isAvailable && !isOutOfStock) {
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
                  color: (!it.isAvailable || isOutOfStock) ? '#999' : '#000',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{it.name}</h4>
                <p style={{ 
                  margin: '0 0 6px', 
                  fontSize: '11px', 
                  color: (!it.isAvailable || isOutOfStock) ? '#bbb' : '#666',
                  fontWeight: '600'
                }}>{it.category}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ 
                    margin: 0, 
                    fontWeight: '800', 
                    color: (!it.isAvailable || isOutOfStock) ? '#bbb' : '#333',
                    fontSize: '15px'
                  }}>₱{parseFloat(it.price).toFixed(2)}</p>
                  {it.rating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', color: '#ffc107' }}>
                      <FaStar size={10} />
                      <span>{it.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#fff' }}>
          <p style={{ fontSize: '18px', fontWeight: '600' }}>No items found</p>
          <p style={{ fontSize: '14px' }}>
            {searchQuery 
              ? 'Try a different search or filter' 
              : availabilityFilter === 'available' 
                ? 'No available items found' 
                : availabilityFilter === 'unavailable' 
                  ? 'No unavailable items found' 
                  : 'No items available'
            }
          </p>
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
        </button>
        <button 
          onClick={() => nav('/add')} 
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