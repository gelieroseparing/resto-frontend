import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';

export default function CategoryPage() {
  const { name } = useParams(); // lower or proper – we normalize
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const proper = (s)=> s.charAt(0).toUpperCase() + s.slice(1);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/items?category=${proper(name)}`)
      .then(r => setItems(r.data));
  }, [name]);

  return (
    <div style={{padding:20}}>
      <h2>{proper(name)} Menu</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
        {items.map(it=>(
          <div key={it._id} style={{background:'#fff',borderRadius:12,boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
            {it.imageUrl ? <img src={it.imageUrl} alt={it.name} style={{width:'100%',height:120,objectFit:'cover'}}/> : <div style={{height:120,background:'#f3f4f6'}}/>}
            <div style={{padding:12}}>
              <div style={{fontWeight:'bold'}}>{it.name}</div>
              <div>₱{it.price}</div>
              <button onClick={()=>navigate('/order', { state: { preselect: it } })} style={{marginTop:8}}>Order</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
