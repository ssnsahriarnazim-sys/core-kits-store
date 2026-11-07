import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

const WA = '966564905417';

export default function App() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [sizes, setSizes] = useState({});

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error) setProducts(data || []);
  }

  const filtered = products.filter(p =>
    (category === 'All' || p.category_id === category) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function order(p) {
    const size = sizes[p.id] || p.sizes?.[0] || '';
    const message = `Assalamu Alaikum! I want to order:\n${p.name}\nSize: ${size}\nPlease share the price.`;
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(message)}`, '_blank');
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="logo" href="#">CORE<span>KITS.</span></a>
        <a className="contact" href={`https://wa.me/${WA}`}>CONTACT ↗</a>
      </header>

      <section className="hero">
        <p className="eyebrow">THE FOOTBALL CULTURE</p>
        <h1>WEAR THE<br /><span>DIFFERENCE.</span></h1>
        <p>Represent your club. Wear your passion.</p>
        <a href="#shop" className="shop-btn">EXPLORE COLLECTION ↗</a>
        <div className="hero-bottom">FOOTBALL IS MORE THAN A GAME.</div>
      </section>

      <main id="shop" className="shop">
        <div className="section-heading">
          <div>
            <p className="eyebrow">OUR COLLECTION</p>
            <h2>Find Your Kit.</h2>
          </div>
          <span>{products.length} PRODUCTS</span>
        </div>

        <input
          className="search"
          placeholder="Search your favourite team..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="filters">
          {['All', 'Club Kits', 'Country Kits'].map(c => (
            <button
              className={category === c ? 'active' : ''}
              onClick={() => setCategory(c)}
              key={c}
            >{c}</button>
          ))}
        </div>

        <div className="products">
          {filtered.map(p => (
            <article className="product" key={p.id}>
              <button className="product-image" onClick={() => setSelected(p)}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} />
                  : <span>CORE KITS.</span>}
              </button>
              <div className="product-info">
                <div>
                  <h3>{p.name}</h3>
                  <p>{p.stock > 0 ? `IN STOCK · ${p.stock} AVAILABLE` : 'CHECK AVAILABILITY'}</p>
                </div>
                <strong>{p.price ? `৳${p.price}` : 'Price on WhatsApp'}</strong>
              </div>
              <div className="product-actions">
                <select value={sizes[p.id] || p.sizes?.[0] || ''}
                  onChange={e => setSizes({...sizes, [p.id]: e.target.value})}>
                  {(p.sizes?.length ? p.sizes : ['Select size']).map(s =>
                    <option key={s}>{s}</option>
                  )}
                </select>
                <button onClick={() => order(p)}>ORDER ↗</button>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="empty">No kits found. New collection coming soon.</p>
        )}
      </main>

      {selected && (
        <div className="modal" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)}>✕</button>
            {selected.image_url && <img src={selected.image_url} alt={selected.name} />}
            <h2>{selected.name}</h2>
            <p>{selected.description || 'Represent your favourite team.'}</p>
            <button onClick={() => order(selected)}>ORDER ON WHATSAPP ↗</button>
          </div>
        </div>
      )}

      <footer>
        <a className="logo" href="#">CORE<span>KITS.</span></a>
        <p>WEAR THE DIFFERENCE.</p>
        <small>© 2026 CORE KITS. ALL RIGHTS RESERVED.</small>
      </footer>
    </div>
  );
}
