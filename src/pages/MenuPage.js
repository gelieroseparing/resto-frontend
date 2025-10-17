import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaEye, FaEyeSlash, FaPlus, FaTimes, FaCheck, FaSearch, FaChartBar, FaHome, FaShoppingCart, FaBox, FaCog } from 'react-icons/fa';

export default function MenuPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: '', 
    price: '', 
    category: 'Breakfast', 
    imageFile: null,
    isAvailable: true,
    description: '',
    stock: 0
  });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState(null);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Create axios instance with baseURL
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {} 
  });

  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Drinks', 'Snack'];

  // Cache images for offline use
  const cacheImages = useCallback(async (items) => {
    const imageCache = await caches.open('menu-images');
    
    items.forEach(item => {
      if (item.imageUrl) {
        const imageUrl = getImageUrl(item.imageUrl);
        // Try to add image to cache if not already cached
        imageCache.add(imageUrl).catch(err => {
          console.log('Image caching failed for:', imageUrl, err);
        });
      }
    });
  }, []);

  // Load items from API
  const loadItems = useCallback(async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data);
      
      // Cache images for offline use
      cacheImages(res.data);
    } catch (err) {
      console.error('Error loading items:', err);
      setError('Failed to load items');
    }
  }, [api, cacheImages]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const submit = async () => {
    if (!form.name || !form.price) {
      setError('Please enter both name and price.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('price', parseFloat(form.price));
      formData.append('category', form.category);
      formData.append('isAvailable', form.isAvailable.toString());
      formData.append('description', form.description || '');
      formData.append('stock', parseInt(form.stock) || 0);
      
      if (form.imageFile) {
        formData.append('image', form.imageFile);
      }

      if (editing) {
        await api.put(`/items/${editing._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Item updated successfully!');
      } else {
        await api.post('/items', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Item added successfully!');
      }

      // Reset form
      setForm({ 
        name: '', 
        price: '', 
        category: 'Breakfast', 
        imageFile: null, 
        isAvailable: true, 
        description: '',
        stock: 0 
      });
      setPreview(null);
      setEditing(null);
      setShowForm(false);
      await loadItems();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(f => ({ ...f, imageFile: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const editItem = (item) => {
    setEditing(item);
    setForm({
      name: item.name,
      price: item.price,
      category: item.category,
      imageFile: null,
      isAvailable: item.isAvailable,
      description: item.description || '',
      stock: item.stock || 0
    });
    setPreview(getImageUrl(item.imageUrl));
    setShowForm(true);
    setError('');
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await api.delete(`/items/${id}`);
      setSuccess('Item deleted successfully!');
      await loadItems();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const formData = new FormData();
      formData.append('isAvailable', (!item.isAvailable).toString());
      
      await api.put(`/items/${item._id}`, formData);
      setSuccess(`Item marked as ${!item.isAvailable ? 'available' : 'unavailable'}!`);
      await loadItems();
    } catch (err) {
      console.error('Toggle availability error:', err);
      setError(err.response?.data?.message || 'Failed to update availability');
    }
  };

  // Update stock quantity
  const updateStock = async (itemId, newStock) => {
    try {
      await api.put(`/items/${itemId}`, { stock: newStock });
      setSuccess('Stock updated successfully!');
      await loadItems();
    } catch (err) {
      console.error('Update stock error:', err);
      setError('Failed to update stock');
    }
  };

  // Improved function to get image URL with better caching and error handling
  const getImageUrl = (imageUrl) => {
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
  };

  // Get cached image URL with fallback
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

  // Improved image error handling with caching
  const handleImageError = async (e, item) => {
    console.log(`MenuPage - Image failed to load:`, e.target.src);
    console.log(`Item: ${item.name}`);
    
    // Hide the broken image initially
    e.target.style.display = 'none';
    
    try {
      // Try to get from cache first
      const cachedUrl = await getCachedImageUrl(item.imageUrl);
      if (cachedUrl && cachedUrl !== e.target.src) {
        console.log('MenuPage - Trying cached URL:', cachedUrl);
        e.target.src = cachedUrl;
        e.target.style.display = 'block';
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
          console.log('MenuPage - Testing alternative URL:', testUrl);
          
          const testImg = new Image();
          testImg.onload = () => {
            console.log('MenuPage - Alternative URL works!');
            e.target.src = testUrl;
            e.target.style.display = 'block';
            
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
            console.log('MenuPage - Alternative URL failed:', testUrl);
          };
          testImg.src = testUrl;
          break;
        }
      }
    } catch (err) {
      console.log('MenuPage - All image loading attempts failed');
    }
  };

  // Preload images when component mounts
  useEffect(() => {
    const preloadImages = async () => {
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
    };

    if (items.length > 0) {
      preloadImages();
    }
  }, [items]);

  const filteredItems = activeCategory === 'All' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  const searchedItems = filteredItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const inputStyle = {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    width: '100%',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    padding: '12px 20px',
    background: 'linear-gradient(90deg, #0b0b0eff, #0a0a13ff)',
    color: '#ff6b93',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const resetForm = () => {
    setForm({ 
      name: '', 
      price: '', 
      category: 'Breakfast', 
      imageFile: null, 
      isAvailable: true, 
      description: '',
      stock: 0 
    });
    setPreview(null);
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  return (
    <div style={{ padding: 20, position: 'relative', background: '#790707ff', minHeight: '100vh' }}>
      
      {/* Topbar with back icon and text */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FaArrowLeft 
            style={{ marginRight: 12, color: '#ededf5ff', cursor: 'pointer', fontSize: '20px' }} 
            onClick={() => navigate(-1)} 
          />
          <h2 style={{ margin: 0, color: '#ededf5ff', fontWeight: '700', fontSize: '24px' }}>
            Menu Management
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            style={buttonStyle} 
            onClick={() => navigate('/analytic')}
          >
            <FaChartBar /> POS Analytics
          </button>
          <button 
            style={buttonStyle} 
            onClick={() => setShowForm(!showForm)}
          >
            <FaPlus /> {showForm ? 'Close Form' : 'Add New Item'}
          </button>
        </div>
      </div>

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

      {/* Search Bar */}
      <div style={{
        position: 'relative',
        marginBottom: '20px'
      }}>
        <input
          type="text"
          placeholder="Search items by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 40px',
            borderRadius: '25px',
            border: 'none',
            backgroundColor: '#fff',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <FaSearch 
          style={{
            position: 'absolute',
            left: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#666'
          }} 
        />
      </div>

      {/* Add Item Card - Collapsible */}
      {showForm && (
        <div style={{ 
          background: '#fff', 
          padding: 24, 
          borderRadius: '12px', 
          marginBottom: 30,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: 20, color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editing ? <><FaEdit /> Update Item</> : <><FaPlus /> Add New Item</>}
          </h3>

          <div style={{ display: 'grid', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#333' }}>Item Name *</label>
              <input
                style={inputStyle}
                placeholder="Enter item name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#333' }}>Price *</label>
                <input
                  type="number"
                  step="0.01"
                  style={inputStyle}
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#333' }}>Initial Stock</label>
                <input
                  type="number"
                  style={inputStyle}
                  placeholder="0"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#333' }}>Category</label>
                <select
                  style={inputStyle}
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#333' }}>Availability</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="availability"
                      checked={form.isAvailable}
                      onChange={() => setForm(f => ({ ...f, isAvailable: true }))}
                      style={{ marginRight: 5 }}
                    />
                    Available
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="availability"
                      checked={!form.isAvailable}
                      onChange={() => setForm(f => ({ ...f, isAvailable: false }))}
                      style={{ marginRight: 5 }}
                    />
                    Unavailable
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#333' }}>Description</label>
              <textarea
                style={{...inputStyle, minHeight: '80px', resize: 'vertical'}}
                placeholder="Enter item description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#333' }}>Image</label>
              <input
                type="file"
                accept="image/*"
                style={inputStyle}
                onChange={handleFileChange}
              />
            </div>
          </div>

          {preview && (
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: '500', color: '#333' }}>Image Preview:</span>
              <img 
                src={preview} 
                alt="preview" 
                style={{ 
                  display: 'block', 
                  marginTop: 8, 
                  maxWidth: '200px', 
                  maxHeight: '200px',
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }} 
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              style={{ 
                ...buttonStyle, 
                opacity: loading ? 0.7 : 1,
                background: loading ? '#6c757d' : 'linear-gradient(90deg, #0b0b0eff, #0a0a13ff)'
              }} 
              onClick={submit} 
              disabled={loading}
            >
              {loading ? 'Processing...' : (editing ? 'Update Item' : 'Add Item')}
            </button>
            <button 
              style={{ 
                padding: '12px 20px', 
                background: '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={resetForm}
            >
              <FaTimes /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div style={{ 
        background: '#fff', 
        padding: 20, 
        borderRadius: '12px', 
        marginBottom: 30,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: 16, color: '#333' }}>Filter by Category</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: activeCategory === category ? '#007bff' : '#f8f9fa',
                color: activeCategory === category ? '#fff' : '#333',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Items Display */}
      <div>
        <h3 style={{ marginBottom: 20, color: '#fff' }}>
          {activeCategory === 'All' ? 'All Menu Items' : `${activeCategory} Items`}
          <span style={{ fontSize: '14px', color: '#ccc', marginLeft: 8, fontWeight: 'normal' }}>
            ({searchedItems.length} {searchedItems.length === 1 ? 'item' : 'items'})
          </span>
        </h3>

        {searchedItems.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            background: '#fff', 
            padding: '40px 20px', 
            borderRadius: '12px',
            color: '#666'
          }}>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>No items found</p>
            <p style={{ fontSize: '14px' }}>
              {searchQuery ? 'Try a different search term' : `No ${activeCategory === 'All' ? '' : activeCategory + ' '}items available`}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {searchedItems.map(item => (
              <div key={item._id} style={{
                background: '#fff',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}>
                {/* Item Image */}
                <div style={{ 
                  position: 'relative',
                  height: '180px',
                  backgroundColor: '#f8f9fa'
                }}>
                  {item.imageUrl ? (
                    <img 
                      src={getImageUrl(item.imageUrl)} 
                      alt={item.name} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        filter: !item.isAvailable ? 'grayscale(50%)' : 'none'
                      }} 
                      onError={(e) => handleImageError(e, item)}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ 
                      height: '100%', 
                      width: '100%',
                      backgroundColor: '#e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#adb5bd',
                      fontSize: '14px'
                    }}>
                      No Image Available
                    </div>
                  )}
                  
                  {/* Availability Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: item.isAvailable ? '#28a745' : '#6c757d',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {item.isAvailable ? <FaEye size={10} /> : <FaEyeSlash size={10} />}
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </div>
                  
                  {/* Category Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(0, 123, 255, 0.9)',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {item.category}
                  </div>

                  {/* Stock Badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    backgroundColor: item.stock > 0 ? '#17a2b8' : '#dc3545',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    Stock: {item.stock || 0}
                  </div>
                </div>
                
                {/* Item Details */}
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '18px', 
                      fontWeight: '700',
                      color: item.isAvailable ? '#333' : '#999'
                    }}>
                      {item.name}
                    </h4>
                    <span style={{ 
                      fontSize: '20px', 
                      fontWeight: '800',
                      color: item.isAvailable ? '#28a745' : '#bbb'
                    }}>
                      ₱{item.price}
                    </span>
                  </div>
                  
                  <p style={{ 
                    margin: '0 0 16px', 
                    fontSize: '14px', 
                    color: item.isAvailable ? '#666' : '#bbb',
                    lineHeight: '1.4'
                  }}>
                    {item.description || 'No description available'}
                  </p>
                  
                  {/* Stock Management */}
                  <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>Stock:</span>
                    <input
                      type="number"
                      value={item.stock || 0}
                      onChange={(e) => updateStock(item._id, parseInt(e.target.value) || 0)}
                      style={{
                        width: '80px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        textAlign: 'center',
                        fontSize: '14px'
                      }}
                    />
                    <button
                      onClick={() => updateStock(item._id, (item.stock || 0) + 1)}
                      style={{
                        padding: '4px 8px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateStock(item._id, Math.max(0, (item.stock || 0) - 1))}
                      style={{
                        padding: '4px 8px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      -1
                    </button>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => editItem(item)}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#0056b3'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#007bff'}
                    >
                      <FaEdit size={14} />
                      Edit
                    </button>
                    
                    <button
                      onClick={() => toggleAvailability(item)}
                      style={{
                        padding: '10px 16px',
                        background: item.isAvailable ? '#ffc107' : '#28a745',
                        color: '#212529',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = item.isAvailable ? '#e0a800' : '#218838'}
                      onMouseLeave={(e) => e.currentTarget.style.background = item.isAvailable ? '#ffc107' : '#28a745'}
                    >
                      {item.isAvailable ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                      {item.isAvailable ? 'Hide' : 'Show'}
                    </button>
                    
                    <button
                      onClick={() => deleteItem(item._id)}
                      style={{
                        padding: '10px 16px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#c82333'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#dc3545'}
                    >
                      <FaTrash size={14} />
                      Delete
                    </button>
                  </div>
                </div>
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
        borderTop: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 0',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
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
          onClick={() => navigate('/order', { state: { cartItems: [] } })} 
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
          <FaBox size={20} color="#007bff" />
          <span style={{ fontSize: '10px', color: '#007bff' }}>Inventory</span>
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