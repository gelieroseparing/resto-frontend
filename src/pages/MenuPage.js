import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaEye, FaEyeSlash, FaPlus, FaTimes, FaCheck, FaSearch } from 'react-icons/fa';

export default function MenuPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ 
    name: '', 
    price: '', 
    category: 'Breakfast', 
    imageFile: null,
    isAvailable: true
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

  // Create axios instance with auth header
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
      formData.append('isAvailable', form.isAvailable.toString());

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

      setForm({ name: '', price: '', category: 'Breakfast', imageFile: null, isAvailable: true });
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
      isAvailable: item.isAvailable
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
      formData.append('isAvailable', (!item.isAvailable).toString());
      
      if (item.imageUrl) {
        // If you need to preserve the image, you might need to handle it differently
      }
      
      await api.put(`/items/${item._id}`, formData);
      setSuccess(`Item marked as ${!item.isAvailable ? 'available' : 'unavailable'}!`);
      await loadItems();
    } catch (err) {
      console.error('Toggle availability error:', err);
      setError('Failed to update availability');
    }
  };

  const filteredItems = activeCategory === 'All' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  const searchedItems = filteredItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: 20, background: '#790707ff', minHeight: '100vh' }}>
      
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FaArrowLeft style={{ marginRight: 12, color: '#fff', cursor: 'pointer' }} onClick={() => navigate(-1)} />
          <h2 style={{ margin: 0, color: '#fff', fontWeight: '700' }}>Menu Management</h2>
        </div>
        <button 
          style={{ 
            padding: '12px 20px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }} 
          onClick={() => setShowForm(!showForm)}
        >
          <FaPlus /> {showForm ? 'Close Form' : 'Add New Item'}
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div style={{ padding: '12px 16px', background: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px' }}>
          <FaCheck /> {success}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '20px' }}>
          <FaTimes /> {error}
        </div>
      )}

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
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
            backgroundColor: '#fff',
            fontSize: '14px'
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

      {/* Add Item Form */}
      {showForm && (
        <div style={{ background: '#fff', padding: 24, borderRadius: '12px', marginBottom: 30 }}>
          <h3 style={{ marginBottom: 20 }}>
            {editing ? <><FaEdit /> Update Item</> : <><FaPlus /> Add New Item</>}
          </h3>

          <div style={{ display: 'grid', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '600' }}>Item Name *</label>
              <input
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', width: '100%' }}
                placeholder="Enter item name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: '600' }}>Price *</label>
                <input
                  type="number"
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', width: '100%' }}
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: '600' }}>Category</label>
                <select
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', width: '100%' }}
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '600' }}>Availability</label>
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
            
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '600' }}>Image</label>
              <input
                type="file"
                accept="image/*"
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', width: '100%' }}
                onChange={handleFileChange}
              />
            </div>
          </div>

          {preview && (
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: '500' }}>Image Preview:</span>
              <img src={preview} alt="preview" style={{ display: 'block', marginTop: 8, maxWidth: '200px', borderRadius: '8px' }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              style={{ padding: '12px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} 
              onClick={submit} 
              disabled={loading}
            >
              {loading ? 'Processing...' : (editing ? 'Update Item' : 'Add Item')}
            </button>
            <button 
              style={{ padding: '12px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => {
                setForm({ name: '', price: '', category: 'Breakfast', imageFile: null, isAvailable: true });
                setPreview(null);
                setEditing(null);
                setShowForm(false);
                setError('');
              }}
            >
              <FaTimes /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div style={{ background: '#fff', padding: 20, borderRadius: '12px', marginBottom: 30 }}>
        <h3 style={{ marginBottom: 16 }}>Filter by Category</h3>
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
                fontWeight: '600'
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
          <span style={{ fontSize: '14px', color: '#ccc', marginLeft: 8 }}>
            ({searchedItems.length} items)
          </span>
        </h3>

        {searchedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#fff' }}>
            {searchQuery ? 'No items found matching your search.' : 'No items found in this category.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {searchedItems.map(item => (
              <div key={item._id} style={{
                background: '#fff',
                padding: 20,
                borderRadius: '12px',
                border: item.isAvailable ? '2px solid #28a745' : '2px solid #dc3545'
              }}>
                {/* Availability badge */}
                <div style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: item.isAvailable ? '#28a745' : '#dc3545',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginBottom: 12
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
                      marginBottom: 16
                    }}
                  />
                )}

                {/* Item Details */}
                <h4 style={{ margin: '0 0 8px 0' }}>{item.name}</h4>
                <p style={{ margin: '0 0 8px 0', color: '#666' }}>Category: {item.category}</p>
                <p style={{ margin: '0 0 16px 0', fontWeight: '700', fontSize: '18px' }}>₱{item.price}</p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => toggleAvailability(item)}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      background: item.isAvailable ? '#ffc107' : '#28a745',
                      color: item.isAvailable ? '#000' : '#fff',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    {item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                  </button>
                  
                  <button
                    onClick={() => editItem(item)}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      background: '#007bff',
                      color: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <FaEdit /> Edit
                  </button>
                  
                  <button
                    onClick={() => deleteItem(item._id)}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      background: '#dc3545',
                      color: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <FaTrash /> Delete
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