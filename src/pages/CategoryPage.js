import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CategoryPage() {
  const { name } = useParams(); // category name from URL
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:5000/api/items?category=${capitalize(name)}`);
        setItems(response.data);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError('Failed to load items.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [name]);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: 20, color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>{capitalize(name)} Menu</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {items.map((it) => (
          <div
            key={it._id}
            style={{
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,.06)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {it.imageUrl ? (
              <img
                src={it.imageUrl}
                alt={it.name}
                style={{ width: '100%', height: 120, objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
              />
            ) : (
              <div style={{ height: 120, background: '#f3f4f6', borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
            )}
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{it.name}</div>
              <div>₱{it.price}</div>
              <button
                onClick={() => navigate('/order', { state: { preselect: it } })}
                style={{
                  marginTop: 8,
                  padding: '8px 12px',
                  backgroundColor: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Order
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}