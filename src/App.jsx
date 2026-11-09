import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

const WA = '966564905417';

export default function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [admin, setAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [form, setForm] = useState({
  name: '',
  description: '',
  price: '',
  original_price: '',
  stock: 0,
  sizes: 'M,L,XL,XXL,XXXL',
  category_id: '',
  image_url: ''
});
  const [editing, setEditing] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
const [orders, setOrders] = useState([]);
const [orderLoading, setOrderLoading] = useState(false);
 const [trackingId, setTrackingId] = useState('');
const [trackingPhone, setTrackingPhone] = useState('');
const [trackedOrder, setTrackedOrder] = useState(null);
const [trackingLoading, setTrackingLoading] = useState(false);
  useEffect(() => {
    loadProducts();
    loadCategories();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) checkAdmin();
    });

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });

    return () => listener.subscription.unsubscribe();
  }, []);
async function loadOrders() {
  setOrderLoading(true);

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    setMessage(error.message);
  } else {
    setOrders(data || []);
  }

  setOrderLoading(false);
}
async function trackOrder(e) {
  e.preventDefault();
  setTrackingLoading(true);
  setTrackedOrder(null);

  const { data, error } = await supabase.rpc('track_order', {
    p_order_id: trackingId.trim(),
    p_phone: trackingPhone.trim()
  });

  if (error) {
    alert('Tracking failed: ' + error.message);
  } else if (!data || data.length === 0) {
    alert('No order found. Check Order ID and phone number.');
  } else {
    setTrackedOrder(data[0]);
  }

  setTrackingLoading(false);
}
async function updateOrderStatus(id, status) {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id);

  if (error) {
    setMessage(error.message);
  } else {
    setMessage('Order status updated!');
    await loadOrders();
  }
}
  async function loadProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setProducts(data || []);
  }

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    setCategories(data || []);
  }

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setAdmin(false);
      return;
    }

    const { data } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    setAdmin(!!data);

if (data) {
  await loadOrders();
} else {
  setOrders([]);
}
  }

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMessage(error.message);
    } else {
      await checkAdmin();
      setMessage('Login successful!');
    }

    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setAdmin(false);
    setShowLogin(false);
  }

  function resetForm() {
  setForm({
    name: '',
    description: '',
    price: '',
    original_price: '',
    stock: 0,
    sizes: 'M,L,XL,XXL,XXXL',
    category_id: categories[0]?.id || '',
    image_url: ''
  });
  setEditing(null);
  setPhoto(null);
  setPhotos([]);
  setExistingImageUrls([]);  
  }

  async function saveProduct(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let image_url = form.image_url;

     let image_urls = [...existingImageUrls];

if (photos.length > 0) {
  for (const photo of photos) {
    const ext = photo.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, photo);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(path);

    image_urls.push(data.publicUrl);
  }
}

if (image_urls.length > 0) {
  image_url = image_urls[0];
} else if (form.image_url) {
  image_url = form.image_url;
}



      const payload = {
        name: form.name,
        description: form.description,
        price: form.price ? Number(form.price) : null,
        original_price: form.original_price ? Number(form.original_price) : null,
        stock: Number(form.stock),
        sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
        category_id: form.category_id || null,
        image_url,
        image_urls,
        is_active: true
      };

      let result;

      if (editing) {
        result = await supabase
          .from('products')
          .update(payload)
          .eq('id', editing);
      } else {
        result = await supabase
          .from('products')
          .insert(payload);
      }

      if (result.error) throw result.error;

      setMessage('Product saved successfully!');
      resetForm();
      await loadProducts();
    } catch (error) {
      setMessage(error.message || 'Something went wrong');
    }

    setLoading(false);
  }

  function editProduct(p) {
    setEditing(p.id);
    setExistingImageUrls(
  p.image_urls?.length
    ? p.image_urls
    : p.image_url ? [p.image_url] : []
);
    setForm({
      name: p.name || '',
      description: p.description || '',
      price: p.price || '',
original_price: p.original_price || '',
stock: p.stock || 0,
sizes: (p.sizes || []).join(','),
      category_id: p.category_id || '',
      image_url: p.image_url || ''
    });
    setPhoto(null);
    setPhotos([]);
    document.getElementById('admin-form')?.scrollIntoView({
      behavior: 'smooth'
    });
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Product deleted.');
      loadProducts();
    }
  }

  async function addCategory() {
    const name = prompt('Category name:');
    if (!name?.trim()) return;

    const { error } = await supabase
      .from('categories')
      .insert({ name: name.trim() });

    if (error) {
      setMessage(error.message);
    } else {
      await loadCategories();
      setMessage('Category added!');
    }
  }

  function order(p, size) {
    const message = `Assalamu Alaikum! I want to order:\n${p.name}\nSize: ${size}\nPlease share the price.`;

    window.open(
      `https://wa.me/${WA}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  }

  const filtered = products.filter(p =>
    p.is_active &&
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (category === 'All' || p.category_id === category)
  );

  return (
    <div className="app">
      <header className="navbar">
        <a className="logo" href="#">CORE<span>KITS.</span></a>

        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <a className="contact" href={`https://wa.me/${WA}`}>
            CONTACT ↗
          </a>
          <button
            onClick={() => setShowLogin(true)}
            style={{border:0,background:'none',fontSize:20}}
            aria-label="Admin login"
          >♙</button>
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">THE FOOTBALL CULTURE</p>
        <h1>WEAR THE<br/><span>DIFFERENCE.</span></h1>
        <p>Represent your club. Wear your passion.</p>
        <a href="#shop" className="shop-btn">
          EXPLORE COLLECTION ↗
        </a>
        <div className="hero-bottom">
          FOOTBALL IS MORE THAN A GAME.
        </div>
      </section>
<section className="tracking-section">
  <div className="tracking-box">
    <p className="eyebrow">ORDER TRACKING</p>
    <h2>Track Your Order.</h2>
    <p>Enter your Order ID and phone number to check your order status.</p>

    <form onSubmit={trackOrder}>
      <input
        className="search"
        placeholder="Enter Order ID"
        value={trackingId}
        onChange={e => setTrackingId(e.target.value)}
        required
      />

      <input
        className="search"
        placeholder="Enter Phone Number"
        value={trackingPhone}
        onChange={e => setTrackingPhone(e.target.value)}
        required
      />

      <button className="admin-submit" disabled={trackingLoading}>
        {trackingLoading ? 'CHECKING...' : 'TRACK ORDER'}
      </button>
    </form>

    {trackedOrder && (
      <div className="tracking-result">
        <h3>{trackedOrder.product_name}</h3>
        <p>Size: {trackedOrder.size}</p>
        <p>Quantity: {trackedOrder.quantity}</p>
        <p>Total: ৳{trackedOrder.total_price ?? 'Not set'}</p>
        <h3>Status: {trackedOrder.status}</h3>
      </div>
    )}
  </div>
</section>
      <main id="shop" className="shop">
        <div className="section-heading">
          <div>
            <p className="eyebrow">OUR COLLECTION</p>
            <h2>Find Your Kit.</h2>
          </div>
          <span>{filtered.length} PRODUCTS</span>
        </div>

        <input
          className="search"
          placeholder="Search your favourite team..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="filters">
          <button
            className={category === 'All' ? 'active' : ''}
            onClick={() => setCategory('All')}
          >All</button>

          {categories.map(c => (
            <button
              key={c.id}
              className={category === c.id ? 'active' : ''}
              onClick={() => setCategory(c.id)}
            >{c.name}</button>
          ))}
        </div>

        <div className="products">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} order={order}/>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="empty">
            No kits found. New collection coming soon.
          </p>
        )}
      </main>

      <footer>
        <a className="logo" href="#">CORE<span>KITS.</span></a>
        <p>WEAR THE DIFFERENCE.</p>
        <small>© 2026 CORE KITS. ALL RIGHTS RESERVED.</small>
      </footer>

      {showLogin && (
        <div className="modal">
          <div className="modal-content">
            <button className="close"
              onClick={() => setShowLogin(false)}>✕</button>

            {!admin ? (
              <>
                <h2>Admin Login</h2>
                <form onSubmit={login}>
                  <input
                    className="search"
                    type="email"
                    placeholder="Admin email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <input
                    className="search"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button className="admin-submit" disabled={loading}>
                    {loading ? 'PLEASE WAIT...' : 'LOGIN'}
                  </button>
                </form>
                {message && <p>{message}</p>}
              </>
            ) : (
              <div>
                <h2>Admin Dashboard</h2>
                <p>Manage your CORE KITS collection.</p>

                <button className="admin-submit" onClick={logout}>
                  LOG OUT
                </button>

                <div id="admin-form">
                  <h3>{editing ? 'Edit Product' : 'Add New Product'}</h3>

                  <form onSubmit={saveProduct}>
                    <input className="search"
                      placeholder="Product name"
                      value={form.name}
                      onChange={e => setForm({...form,name:e.target.value})}
                      required
                    />

                    <textarea className="search"
                      placeholder="Description"
                      value={form.description}
                      onChange={e => setForm({...form,description:e.target.value})}
                    />

                    <input className="search"
                      type="number"
                      placeholder="Price in BDT"
                      value={form.price}
                      onChange={e => setForm({...form,price:e.target.value})}
                    />
<input
  className="search"
  type="number"
  placeholder="Original Price (BDT)"
  value={form.original_price}
  onChange={e =>
    setForm({...form, original_price: e.target.value})
  }
/>
                    <input className="search"
                      type="number"
                      placeholder="Stock"
                      value={form.stock}
                      onChange={e => setForm({...form,stock:e.target.value})}
                    />

                    <input className="search"
                      placeholder="Sizes: M,L,XL"
                      value={form.sizes}
                      onChange={e => setForm({...form,sizes:e.target.value})}
                    />

                    <select className="search"
                      value={form.category_id}
                      onChange={e => setForm({...form,category_id:e.target.value})}
                    >
                      <option value="">Select category</option>
                      {categories.map(c =>
                        <option key={c.id} value={c.id}>{c.name}</option>
                      )}
                    </select>
<label>Product Photos (Up to 4)</label>
<input
  className="search"
  type="file"
  accept="image/*"
  multiple
  onChange={e => setPhotos(Array.from(e.target.files || []).slice(0, 4))}
/>

                    <button className="admin-submit" disabled={loading}>
                      {loading ? 'SAVING...' : editing ? 'UPDATE PRODUCT' : 'ADD PRODUCT'}
                    </button>

                    {editing && (
                      <button type="button" className="admin-submit"
                        onClick={resetForm}>
                        CANCEL EDIT
                      </button>
                    )}
                  </form>

                  <button className="admin-submit"
                    onClick={addCategory}>
                    + ADD CATEGORY
                  </button>

                  {message && <p>{message}</p>}
<h3>Manage Orders ({orders.length})</h3>

{orderLoading && <p>Loading orders...</p>}

{!orderLoading && orders.length === 0 && (
  <p>No orders received yet.</p>
)}

{orders.map(o => (
  <div
    key={o.id}
    style={{
      border: '1px solid #ddd',
      padding: 14,
      marginBottom: 12,
      borderRadius: 8
    }}
  >
    <h4>{o.product_name}</h4>

    <p><strong>Customer:</strong> {o.customer_name}</p>
    <p><strong>Phone:</strong> {o.phone}</p>
    <p><strong>Address:</strong> {o.address}</p>
    <p><strong>Size:</strong> {o.size}</p>
    <p><strong>Quantity:</strong> {o.quantity}</p>
    <p><strong>Total:</strong> ৳{o.total_price ?? 'Not set'}</p>
    <p><strong>Date:</strong> {new Date(o.created_at).toLocaleString()}</p>

    <label>Order Status</label>

    <select
      className="search"
      value={o.status}
      onChange={e => updateOrderStatus(o.id, e.target.value)}
    >
      <option value="Pending">Pending</option>
      <option value="Confirmed">Confirmed</option>
      <option value="Shipped">Shipped</option>
      <option value="Delivered">Delivered</option>
      <option value="Cancelled">Cancelled</option>
    </select>
  </div>
))}
                  <h3>Products ({products.length})</h3>

                  {products.map(p => (
                    <div key={p.id}
                      style={{
                        display:'flex',justifyContent:'space-between',
                        alignItems:'center',gap:8,
                        borderBottom:'1px solid #ddd',padding:'12px 0'
                      }}>
                      <div>
                        <strong>{p.name}</strong>
                        <p>Stock: {p.stock} | Price: {p.price || 'On request'}</p>
                      </div>
                      <div style={{display:'flex',gap:6}}>
                        <button onClick={() => editProduct(p)}>Edit</button>
                        <button onClick={() => deleteProduct(p.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({product, order}) {
  const [size, setSize] = useState(product.sizes?.[0] || '');
  const [showOrder, setShowOrder] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [quantity, setQuantity] = useState(1);
const [orderId, setOrderId] = useState('');
  async function submitOrder(e) {
    e.preventDefault();

    if (product.stock < 1 || Number(quantity) > product.stock) {
      alert('Not enough stock available!');
      return;
    }

    const { data: order, error } = await supabase
  .from('orders')
  .insert({
    customer_name: customerName,
    phone: phone,
    address: address,
    product_id: product.id,
    product_name: product.name,
    size: size,
    quantity: Number(quantity),
    unit_price: product.price || null,
    total_price: product.price
      ? Number(product.price) * Number(quantity)
      : null,
    status: 'Pending'
  })
  .select('id')
  .single();

    if (error) {
      alert('Order failed: ' + error.message);
 } else {
  setOrderId(order.id);
  alert('Order placed successfully! Your Order ID: ' + order.id);
  setShowOrder(false);
  setCustomerName('');
  setPhone('');
  setAddress('');
  setQuantity(1);
    }
  }

  return (
    <article className="product">
      <div className="product-image">
  {product.image_urls?.length > 0 ? (
    <div className="product-gallery">
      {product.image_urls.map((url, index) => (
        <img
          key={index}
          src={url}
          alt={`${product.name} ${index + 1}`}
        />
      ))}
    </div>
  ) : product.image_url ? (
    <img src={product.image_url} alt={product.name} />
  ) : (
    <span>CORE KITS.</span>
  )}
</div>

      <div className="product-info">
        <div>
          <h3>{product.name}</h3>
          <p>
            {product.stock > 0
              ? `IN STOCK · ${product.stock} AVAILABLE`
              : 'CHECK AVAILABILITY'}
          </p>
        </div>

        <strong>
          <div className="product-price">
  {product.original_price > product.price && (
    <span className="original-price">
      ৳{product.original_price}
    </span>
  )}

  <strong>
    {product.price
      ? `৳${product.price}`
      : 'Price on WhatsApp'}
  </strong>

  {product.original_price > product.price && (
    <span className="discount-badge">
      {Math.round(
        ((product.original_price - product.price) /
          product.original_price) * 100
      )}% OFF
    </span>
  )}
</div>
        </strong>
      </div>

      <div className="product-actions">
        <select
          value={size}
          onChange={e => setSize(e.target.value)}
        >
          {(product.sizes?.length
            ? product.sizes
            : ['Select size']
          ).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button
          disabled={product.stock < 1}
          onClick={() => setShowOrder(true)}
        >
          ORDER NOW ↗
        </button>
      </div>

      {showOrder && (
        <form onSubmit={submitOrder} className="order-form">
          <h3>Complete Your Order</h3>

          <input
            placeholder="Your full name"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            required
          />

          <input
            placeholder="Phone number"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />

          <textarea
            placeholder="Delivery address"
            value={address}
            onChange={e => setAddress(e.target.value)}
            required
          />

          <p>Selected size: {size}</p>

          <input
            type="number"
            min="1"
            max={product.stock}
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            required
          />

          <button type="submit">CONFIRM ORDER</button>

          <button
            type="button"
            onClick={() => setShowOrder(false)}
          >
            CANCEL
          </button>
        </form>
      )}
      
      {orderId && (
        <div className="order-success">
          <h3>Order placed successfully!</h3>
          <p>Save your Order ID to track your order:</p>
          <strong>{orderId}</strong>
        </div>
      )}
    </article>
  );
}
