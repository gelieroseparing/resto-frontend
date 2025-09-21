import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { FaArrowLeft, FaEdit, FaTrash, FaEye, FaEyeSlash, FaPlus, FaTimes, FaCheck, FaSearch } from 'react-icons/fa';

export default function MenuPage() {
  const { token } = useAuth();
  const [form, setForm] = useState({ 
    name: '', 
    price: '', 
    category: 'Breakfast', 
    imageFile: null,
    isAvailable: true,
    description: ''
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

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Drinks', 'Snack'];

  // Load items from API
  const loadItems = useCallback(async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data);
    } catch (err) {
      console.error('Error loading items:', err);
      setError('Failed to load items');
    }
  }, [api]);

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
      formData.append('price', form.price);
      formData.append('category', form.category);
      formData.append('isAvailable', form.isAvailable);
      formData.append('description', form.description);
      if (form.imageFile) formData.append('image', form.imageFile);

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

      setForm({ name: '', price: '', category: 'Breakfast', imageFile: null, isAvailable: true, description: '' });
      setPreview(null);
      setEditing(null);
      setShowForm(false);
      await loadItems();
    } catch (err) {
      console.error(err);
      setError('Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setForm(f => ({ ...f, imageFile: file }));
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const editItem = (item) => {
    setEditing(item);
    setForm({
      name: item.name,
      price: item.price,
      category: item.category,
      imageFile: null,
      isAvailable: item.isAvailable,
      description: item.description || ''
    });
    setPreview(item.imageUrl ? `http://localhost:5000${item.imageUrl}` : null);
    setShowForm(true);
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await api.delete(`/items/${id}`);
      setSuccess('Item deleted successfully!');
      await loadItems();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete item');
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const formData = new FormData();
      formData.append('name', item.name);
      formData.append('price', item.price);
      formData.append('category', item.category);
      formData.append('isAvailable', !item.isAvailable);
      formData.append('description', item.description || '');
      
      await api.put(`/items/${item._id}`, formData);
      setSuccess(`Item marked as ${!item.isAvailable ? 'unavailable' : 'available'}!`);
      await loadItems();
    } catch (err) {
      console.error('Toggle availability error:', err);
      setError('Failed to update availability');
    }
  };

  const filteredItems = activeCategory === 'All' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  // Filter items by search query
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
    setForm({ name: '', price: '', category: 'Breakfast', imageFile: null, isAvailable: true, description: '' });
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
          <FaArrowLeft style={{ marginRight: 12, color: '#ededf5ff', cursor: 'pointer' }} onClick={() => window.history.back()} />
          <h2 style={{ margin: 0, color: '#ededf5ff', fontWeight: '700' }}>Menu Management</h2>
        </div>
        <button 
          style={buttonStyle} 
          onClick={() => setShowForm(!showForm)}
        >
          <FaPlus /> {showForm ? 'Close Form' : 'Add New Item'}
        </button>
      </div>

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

      {/* Search Bar */}
      <div style={{
        position: 'relative',
        marginBottom: '20px'
      }}>
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 40px',
            borderRadius: '25px',
            border: 'none',
            backgroundColor: '#ca9a9aff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontSize: '14px',
            color: '#1a191dff'
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

      {/* Add Item Card - Collapsible */}
      {showForm && (
        <div style={{ 
          background: '#ca9a9aff', 
          padding: 24, 
          borderRadius: '12px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
          maxWidth: 800, 
          margin: '0 auto 30px auto',
          transition: 'all 0.3s ease' 
        }}>
          <h3 style={{ marginBottom: 20, color: '#13131aff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editing ? <><FaEdit /> Update Item</> : <><FaPlus /> Add New Item</>}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#191b1fff' }}>Item Name *</label>
              <input
                style={inputStyle}
                placeholder="Enter item name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#050608ff' }}>Price *</label>
              <input
                type="number"
                style={inputStyle}
                placeholder="0.00"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#040404ff' }}>Category</label>
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
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#06080bff' }}>Availability</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="availability"
                    checked={form.isAvailable === true}
                    onChange={() => setForm(f => ({ ...f, isAvailable: true }))}
                    style={{ marginRight: 5 }}
                  />
                  Available
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="availability"
                    checked={form.isAvailable === false}
                    onChange={() => setForm(f => ({ ...f, isAvailable: false }))}
                    style={{ marginRight: 5 }}
                  />
                  Unavailable
                </label>
              </div>
            </div>
            
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#070708ff' }}>Description</label>
              <textarea
                style={{...inputStyle, minHeight: '80px', resize: 'vertical'}}
                placeholder="Enter item description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#030406ff' }}>Image</label>
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
              <span style={{ fontSize: 14, color: '#050608ff', fontWeight: '500' }}>Image Preview:</span>
              <img src={preview} alt="preview" style={{ display: 'block', marginTop: 8, maxWidth: '200px', borderRadius: '8px', border: '1px solid #4969abff' }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              style={{...buttonStyle, opacity: loading ? 0.7 : 1}} 
              onClick={submit} 
              disabled={loading}
            >
              {loading ? 'Processing...' : (editing ? 'Update Item' : 'Add Item')}
            </button>
            <button 
              style={{ 
                padding: '12px 20px', 
                background: '#080606ff', 
                color: '#ff6b93', 
                fontWeight: '600', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
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
        background: '#dbb5bfff', 
        padding: 20, 
        borderRadius: '12px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
        maxWidth: 800, 
        margin: '0 auto 30px auto',
      }}>
        <h3 style={{ marginBottom: 16, color: '#08080dff', fontSize: '18px' }}>Filter by Category</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: activeCategory === category ? '#ff6b93' : '#f3f4f6',
                color: activeCategory === category ? '#fff' : '#4b5563',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Items Display */}
      <div>
        <h3 style={{ marginBottom: 20, color: '#f6f7f8ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeCategory === 'All' ? 'All Menu Items' : `${activeCategory} Items`}
          <span style={{ fontSize: '15px', color: '#e2e6edff', fontWeight: 'normal' }}>
            ({searchedItems.length} {searchedItems.length === 1 ? 'item' : 'items'})
          </span>
        </h3>

        {searchedItems.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 40, 
            color: '#9ca3af', 
            background: '#fff', 
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            {searchQuery ? 'No items found matching your search.' : 'No items found in this category.'}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: 20 
          }}>
            {searchedItems.map(item => (
              <div key={item._id} style={{
                background: '#dbb5bfff',
                padding: 20,
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: item.isAvailable ? '1px solid #c25d5dff' : '1px solid #fecaca',
                position: 'relative',
                opacity: item.isAvailable ? 1 : 0.85,
                transition: 'all 0.2s ease'
              }}>
                {/* Availability badge */}
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: item.isAvailable ? '#10b981' : '#6b7280',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {item.isAvailable ? <FaEye /> : <FaEyeSlash />}
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </div>

                {/* Item Image */}
                {item.imageUrl && (
                  <img 
                    src={`http://localhost:5000${item.imageUrl}`} 
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '180px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: 16,
                      border: '1px solid #f3f4f6',
                      filter: !item.isAvailable ? 'grayscale(50%)' : 'none'
                    }}
                  />
                )}

                {/* Item Details */}
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  color: item.isAvailable ? '#121315ff' : '#6b7280',
                  textDecoration: !item.isAvailable ? 'line-through' : 'none'
                }}>
                  {item.name}
                </h4>
                
                {item.description && (
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    color: '#020203ff', 
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}>
                    {item.description}
                  </p>
                )}
                
                <p style={{ margin: '0 0 8px 0', color: '#07090dff', fontSize: '14px' }}>
                  Category: <span style={{ fontWeight: '600', textTransform: 'capitalize', color: '#08080eff' }}>{item.category}</span>
                </p>
                
                <p style={{ 
                  margin: '0 0 16px 0', 
                  color: item.isAvailable ? '#060609ff' : '#6b7280', 
                  fontWeight: '700', 
                  fontSize: '18px',
                  textDecoration: !item.isAvailable ? 'line-through' : 'none'
                }}>
                  ₱{item.price}
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => toggleAvailability(item)}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      background: item.isAvailable ? '#fef3c7' : '#dcfce7',
                      color: item.isAvailable ? '#d97706' : '#166534',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontWeight: '600',
                      fontSize: '14px',
                      flex: 1
                    }}
                  >
                    {item.isAvailable ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    {item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                  </button>
                  
                  <button
                    onClick={() => editItem(item)}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      background: '#e0e7ff',
                      color: '#3730a3',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    <FaEdit size={14} /> Edit
                  </button>
                  
                  <button
                    onClick={() => deleteItem(item._id)}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      background: '#fee2e2',
                      color: '#dc2626',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    <FaTrash size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}