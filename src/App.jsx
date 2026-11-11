import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

const WA = '966564905417';

export default function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [compareItems, setCompareItems] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [priceLimit, setPriceLimit] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [deliveryArea, setDeliveryArea] = useState('inside');
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState('');
  const [admin, setAdmin] = useState(false);
  const isAdminRoute = window.location.pathname === '/admin' || window.location.pathname === '/admin/';
  const [showLogin, setShowLogin] = useState(isAdminRoute);
  const [showAccount, setShowAccount] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customerAuthMode, setCustomerAuthMode] = useState('login');
  const [customerAuthBusy, setCustomerAuthBusy] = useState(false);
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
const [customerOrders, setCustomerOrders] = useState([]);
const [customerOrdersLoading, setCustomerOrdersLoading] = useState(false);
const [productReviews, setProductReviews] = useState([]);
const [reviewRating, setReviewRating] = useState(5);
const [reviewText, setReviewText] = useState('');
const [reviewBusy, setReviewBusy] = useState(false);
const [reviewMessage, setReviewMessage] = useState('');

const [orderLoading, setOrderLoading] = useState(false);
 const [trackingId, setTrackingId] = useState('');
const [trackingPhone, setTrackingPhone] = useState('');
const [trackedOrder, setTrackedOrder] = useState(null);
const [trackingLoading, setTrackingLoading] = useState(false);
  const defaultStorefrontSettings = {
    announcement: 'FREE DELIVERY UPDATES · PREMIUM FOOTBALL KITS · MADE FOR FANS', bannerUrl: '', logoText: 'CORE KITS',
    navHome: 'HOME', navShop: 'SHOP ALL', navCollections: 'COLLECTIONS', navTracking: 'TRACK ORDER',
    sectionOrder: ['choice','recommended','collections','tracking','shop'],
    categoryStripTitle: 'SHOP BY CATEGORY', allProductsLabel: 'ALL PRODUCTS',
    shopEyebrow: 'THE CORE KITS STORE', shopTitle: 'Explore All Products', shopDescription: 'Choose your team. Find your fit. Get match-day ready.', searchPlaceholder: 'Search your favourite team...',
    trackingEyebrow: 'ORDER TRACKING', trackingTitle: 'Track Your Order.', trackingDescription: 'Enter your Order ID and phone number to check your order status.', trackingButton: 'TRACK ORDER',
    collectionTileCta: 'SHOP COLLECTION', footerShopHeading: 'SHOP', footerHelpHeading: 'HELP & SUPPORT', footerContactLabel: 'Contact on WhatsApp', footerAccountLabel: 'My Account', copyrightText: '© 2026 CORE KITS. ALL RIGHTS RESERVED.', footerBottomText: 'BUILT FOR THE LOVE OF THE GAME.',
    choiceEyebrow: 'FAN FAVOURITES', choiceTitle: 'Customer Choice', choiceEnabled: true, choiceProductIds: [], choiceLimit: 4,
    recommendedEnabled: true, recommendedEyebrow: 'HANDPICKED FOR YOU', recommendedTitle: 'Recommended Collection', recommendedCategoryId: 'all', recommendedLimit: 4,
    collectionsEnabled: true, collectionsEyebrow: 'FIND YOUR STYLE', collectionsTitle: 'Explore Collections', trackingEnabled: true,
    footerTagline: 'WEAR YOUR PASSION.', footerDescription: 'Football culture, premium kits and match-day essentials for every fan.',
    backgroundColor: '#f7f5f0', accentColor: '#b89a62', textColor: '#171717'
  };
  const [storefrontSettings, setStorefrontSettings] = useState(defaultStorefrontSettings);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  useEffect(() => {
    if (!selectedProduct?.id) {
      setProductReviews([]);
      setReviewMessage('');
      return;
    }
    loadProductReviews(selectedProduct.id);
    setReviewText('');
    setReviewRating(5);
  }, [selectedProduct?.id]);

  async function loadProductReviews(productId) {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('id, customer_name, rating, review_text, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (!error) setProductReviews(data || []);
  }

  async function submitProductReview(e) {
    e.preventDefault();
    if (!customer?.id || !selectedProduct?.id) {
      setReviewMessage('Please log in to write a review.');
      return;
    }
    if (reviewText.trim().length < 5) {
      setReviewMessage('Please write at least 5 characters.');
      return;
    }
    setReviewBusy(true);
    setReviewMessage('');
    const customerName = customer.user_metadata?.full_name || customer.user_metadata?.name || customer.email?.split('@')[0] || 'Customer';
    const { error } = await supabase.from('product_reviews').upsert({
      product_id: selectedProduct.id,
      customer_id: customer.id,
      customer_name: customerName,
      rating: Number(reviewRating),
      review_text: reviewText.trim()
    }, { onConflict: 'product_id,customer_id' });
    if (error) {
      setReviewMessage(error.code === '42P01' ? 'Reviews database migration is not applied yet.' : error.code === '42501' ? 'Please log in again to submit your review.' : error.message);
    } else {
      setReviewMessage('Your review has been saved. Thank you!');
      setReviewText('');
      await loadProductReviews(selectedProduct.id);
    }
    setReviewBusy(false);
  }

  useEffect(() => {
    if (!customer?.id) {
      setCustomerOrders([]);
      return;
    }
    loadCustomerOrders();
  }, [customer?.id]);

  async function loadCustomerOrders() {
    if (!customer?.id) return;
    setCustomerOrdersLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });
    if (!error) setCustomerOrders(data || []);
    setCustomerOrdersLoading(false);
  }

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadStorefrontSettings();

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setMessage(error.message);
        return;
      }
      setCustomer(data.session?.user || null);
      if (data.session?.user) checkAdmin();
    });

    // Do not call Supabase APIs inside onAuthStateChange: it can deadlock
    // while the auth lock is held. Defer the admin check until the callback ends.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCustomer(session?.user || null);
      if (session?.user) {
        window.setTimeout(() => checkAdmin(), 0);
      } else {
        setAdmin(false);
        setOrders([]);
      }
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
    const orderRows = data || [];
    if (orderRows.length) {
      const { data: itemRows, error: itemError } = await supabase
        .from('order_items').select('*').in('order_id', orderRows.map(order => order.id));
      const grouped = {};
      if (!itemError) (itemRows || []).forEach(item => {
        (grouped[item.order_id] ||= []).push(item);
      });
      setOrders(orderRows.map(order => ({ ...order, order_items: grouped[order.id] || [] })));
    } else setOrders([]);
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

  async function loadStorefrontSettings() {
    const { data, error } = await supabase.from('storefront_settings').select('settings').eq('id', 'default').maybeSingle();
    if (!error && data?.settings) setStorefrontSettings({ ...defaultStorefrontSettings, ...data.settings });
    setSettingsLoaded(true);
  }
  async function saveStorefrontSettings(e) {
    e.preventDefault(); setSettingsBusy(true); setMessage('');
    try {
      const nextSettings = { ...storefrontSettings };
      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop() || 'jpg';
        const path = 'storefront-banner-' + Date.now() + '.' + ext;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(path, bannerFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('product-images').getPublicUrl(path);
        nextSettings.bannerUrl = data.publicUrl;
      }
      const { error } = await supabase.from('storefront_settings').upsert({ id: 'default', settings: nextSettings, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (error) throw error;
      setStorefrontSettings(nextSettings); setBannerFile(null); setMessage('Website customization saved successfully!');
    } catch (error) {
      setMessage(error.code === '42P01' ? 'Customization database setup is not complete. Apply the new SQL migration first.' : error.message || 'Could not save website settings.');
    }
    setSettingsBusy(false);
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

  async function customerPasswordAuth(e) {
    e.preventDefault();
    setCustomerAuthBusy(true);
    setMessage('');
    const cleanEmail = email.trim().toLowerCase();
    const result = customerAuthMode === 'signup'
      ? await supabase.auth.signUp({ email: cleanEmail, password })
      : await supabase.auth.signInWithPassword({ email: cleanEmail, password });

    if (result.error) {
      setMessage(result.error.message);
    } else if (customerAuthMode === 'signup' && !result.data.session) {
      setMessage('Account created. If email confirmation is enabled, confirm your email before logging in.');
    } else {
      setPassword('');
      setMessage(customerAuthMode === 'signup' ? 'Account created successfully!' : 'Login successful!');
    }
    setCustomerAuthBusy(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setAdmin(false);
    setCustomer(null);
    setShowLogin(false);
    setShowAccount(false);
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

  function addToCart(product, size, quantity, customName = '', customNumber = '', sleeve = 'Short Sleeve') {
    setCartItems(current => {
      const existing = current.find(item => item.product.id === product.id && item.size === size && item.customName === customName && item.customNumber === customNumber && item.sleeve === sleeve);
      if (existing) return current.map(item => item === existing ? {...item, quantity: Math.min(Number(product.stock || 99), item.quantity + quantity)} : item);
      return [...current, {product, size, quantity, customName, customNumber, sleeve}];
    });
    setSelectedProduct(null);
    setMessage('Added to cart!');
  }

  function buyNow(product, size, quantity, customName = '', customNumber = '', sleeve = 'Short Sleeve') {
    setCartItems([{product, size, quantity, customName, customNumber, sleeve}]);
    setSelectedProduct(null);
    setShowCheckout(true);
  }

  function updateCartQuantity(productId, size, quantity, customName = '', customNumber = '', sleeve = 'Short Sleeve') {
    const matches = item => item.product.id === productId && item.size === size && (item.customName || '') === customName && (item.customNumber || '') === customNumber && (item.sleeve || 'Short Sleeve') === sleeve;
    if (quantity < 1) {
      setCartItems(current => current.filter(item => !matches(item)));
      return;
    }
    setCartItems(current => current.map(item => matches(item) ? {...item, quantity: Math.min(Number(item.product.stock || 99), quantity)} : item));
  }

  const cartSubtotal = cartItems.reduce((sum,item) => sum + Number(item.product.price || 0) * item.quantity, 0);
  const deliveryFee = deliveryArea === 'inside' ? 70 : 130;
  const checkoutTotal = cartSubtotal + deliveryFee;

  async function placeCheckoutOrder(e) {
    e.preventDefault();
    if (!cartItems.length) return;
    setCheckoutBusy(true);
    const itemNames = cartItems.map(item => `${item.product.name} (Size: ${item.size}, ${item.sleeve || 'Short Sleeve'}${item.customName ? `, Name: ${item.customName}` : ''}${item.customNumber ? `, Number: ${item.customNumber}` : ''} × ${item.quantity})`).join(' | ');
    const totalQuantity = cartItems.reduce((sum,item) => sum + item.quantity, 0);
    const {data, error} = await supabase.from('orders').insert({
      customer_name: checkoutName.trim(),
      phone: checkoutPhone.trim(),
      address: checkoutAddress.trim(),
      delivery_area: deliveryArea,
      delivery_fee: deliveryFee,
      subtotal: cartSubtotal,
      customer_id: customer?.id || null,
      product_id: cartItems.length === 1 ? cartItems[0].product.id : null,
      product_name: itemNames,
      size: cartItems.map(item => item.size).join(', '),
      quantity: totalQuantity,
      unit_price: null,
      total_price: checkoutTotal,
      status: 'Pending'
    }).select('id').single();
    if (error) {
      setCheckoutBusy(false);
      setMessage('Order failed: ' + error.message);
      return;
    }
    const itemPayload = cartItems.map(item => ({
      order_id: data.id, product_id: item.product.id, product_name: item.product.name,
      size: [item.size, item.sleeve || 'Short Sleeve', item.customName && `Name: ${item.customName}`, item.customNumber && `No: ${item.customNumber}`].filter(Boolean).join(' / '), quantity: item.quantity, unit_price: Number(item.product.price || 0),
      line_total: Number(item.product.price || 0) * item.quantity
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(itemPayload);
    if (itemsError) {
      // Do not report success or clear the cart when item rows were not saved.
      // Remove the parent order so its cascade also removes any partial item rows.
      const { error: rollbackError } = await supabase.from('orders').delete().eq('id', data.id);
      setCheckoutBusy(false);
      if (rollbackError) {
        setMessage('Order details could not be saved. Order reference ' + data.id + '. Please contact support before retrying. ' + itemsError.message);
      } else {
        setMessage('Order was not completed because item details could not be saved. Your cart is unchanged. Please try again. ' + itemsError.message);
      }
      return;
    }
    setCheckoutBusy(false);
    setCheckoutResult(data.id);
    setCartItems([]);
    setShowCheckout(false);
    setShowCart(false);
    setCheckoutName('');
    setCheckoutPhone('');
    setCheckoutAddress('');
    if (customer?.id) await loadCustomerOrders();
  }

  const choiceProducts = storefrontSettings.choiceProductIds?.length
    ? storefrontSettings.choiceProductIds.map(id => products.find(p => p.id === id)).filter(p => p?.is_active).slice(0, Number(storefrontSettings.choiceLimit) || 4)
    : products.filter(p => p.is_active).slice(0, Number(storefrontSettings.choiceLimit) || 4);
  const recommendedProducts = products.filter(p => p.is_active &&
    (storefrontSettings.recommendedCategoryId === 'all' || p.category_id === storefrontSettings.recommendedCategoryId)
  ).slice(0, Number(storefrontSettings.recommendedLimit) || 4);
  const filtered = products.filter(p =>
    p.is_active &&
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (category === 'All' || p.category_id === category) &&
    (!priceLimit || Number(p.price || 0) <= Number(priceLimit))
  ).sort((a,b) => {
    if (sortBy === 'price-low') return Number(a.price || 0) - Number(b.price || 0);
    if (sortBy === 'price-high') return Number(b.price || 0) - Number(a.price || 0);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  function toggleWishlist(product) {
    setWishlist(current => current.includes(product.id) ? current.filter(id => id !== product.id) : [...current, product.id]);
  }
  function toggleCompare(product) {
    setCompareItems(current => current.includes(product.id)
      ? current.filter(id => id !== product.id)
      : current.length >= 3 ? current : [...current, product.id]);
  }
  const compareProducts = products.filter(p => compareItems.includes(p.id));

  return (
    <div className="app" style={{'--store-bg':storefrontSettings.backgroundColor,'--store-accent':storefrontSettings.accentColor,'--store-text':storefrontSettings.textColor}}>
      <div className="top-announcement">{storefrontSettings.announcement}</div>
      <header className="navbar">
        <button className="header-icon mobile-menu-trigger" onClick={() => setShowMenu(true)} aria-label="Open menu">☰</button>
        <a className="logo" href="#">{(storefrontSettings.logoText || 'CORE KITS').split(' ')[0]}<span>{(storefrontSettings.logoText || 'CORE KITS').split(' ').slice(1).join(' ')}</span><i>.</i></a>
        <nav className="desktop-links">
          <a href="#">{storefrontSettings.navHome || 'HOME'}</a><a href="#shop">{storefrontSettings.navShop || 'SHOP ALL'}</a><a href="#collections">{storefrontSettings.navCollections || 'COLLECTIONS'}</a><a href="#tracking">{storefrontSettings.navTracking || 'TRACK ORDER'}</a>
        </nav>
        <div className="header-tools">
          <button className="header-icon" onClick={() => document.getElementById('product-search')?.focus()} aria-label="Search">⌕</button>
          <button className="header-icon" onClick={() => setShowWishlist(true)} aria-label="Wishlist">♡<small className="header-count">{wishlist.length}</small></button>
          <button className="header-icon" onClick={() => setShowAccount(true)} aria-label="My account">♙</button>
          <button className="header-icon header-cart" onClick={() => setShowCart(true)} aria-label="Shopping cart">♧<small>{cartItems.reduce((n,item)=>n+item.quantity,0)}</small></button>
        </div>
      </header>

      {storefrontSettings.bannerUrl && <section className="custom-store-banner"><img src={storefrontSettings.bannerUrl} alt="CORE KITS custom banner"/></section>}
      <div className="homepage-sections">
      <section style={{order:-1}} className="designer-strip">
        <div className="designer-label">{storefrontSettings.categoryStripTitle || 'SHOP BY CATEGORY'}</div>
        <button className={category === 'All' ? 'selected' : ''} onClick={() => setCategory('All')}>{storefrontSettings.allProductsLabel || 'ALL PRODUCTS'}</button>
        {categories.slice(0,7).map(c => <button key={c.id} className={category === c.id ? 'selected' : ''} onClick={() => {setCategory(c.id);document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});}}>{c.name}</button>)}
      </section>

      {storefrontSettings.choiceEnabled && <section style={{order: storefrontSettings.sectionOrder?.indexOf('choice') ?? 1}} className="featured-section">
        <div className="collection-heading"><div><p className="eyebrow">{storefrontSettings.choiceEyebrow}</p><h2>{storefrontSettings.choiceTitle}</h2></div><a href="#shop">VIEW ALL <b>↗</b></a></div>
        <div className="products featured-products">{choiceProducts.map(p => <ProductCard key={'featured-' + p.id} product={p} onOpen={() => setSelectedProduct(p)} wished={wishlist.includes(p.id)} compared={compareItems.includes(p.id)} onWishlist={()=>toggleWishlist(p)} onCompare={()=>toggleCompare(p)}/>)}</div>
      </section>}
      {storefrontSettings.recommendedEnabled && <section style={{order: storefrontSettings.sectionOrder?.indexOf('recommended') ?? 2}} className="featured-section recommended-section">
        <div className="collection-heading"><div><p className="eyebrow">{storefrontSettings.recommendedEyebrow}</p><h2>{storefrontSettings.recommendedTitle}</h2></div><a href="#shop">SHOP ALL <b>↗</b></a></div>
        <div className="products featured-products">{recommendedProducts.map(p => <ProductCard key={'recommended-' + p.id} product={p} onOpen={() => setSelectedProduct(p)} wished={wishlist.includes(p.id)} compared={compareItems.includes(p.id)} onWishlist={()=>toggleWishlist(p)} onCompare={()=>toggleCompare(p)}/>)}</div>
      </section>}

      {storefrontSettings.collectionsEnabled && <section style={{order: storefrontSettings.sectionOrder?.indexOf('collections') ?? 3}} id="collections" className="collection-section">
        <div className="collection-heading"><div><p className="eyebrow">{storefrontSettings.collectionsEyebrow}</p><h2>{storefrontSettings.collectionsTitle}</h2></div><a href="#shop">ALL PRODUCTS <b>↗</b></a></div>
        <div className="collection-tiles">
          {categories.slice(0,4).map((c,i) => <button key={c.id} onClick={() => {setCategory(c.id); document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});}}><span>0{i+1}</span><strong>{c.name}</strong><small>{storefrontSettings.collectionTileCta || 'SHOP COLLECTION'} ↗</small></button>)}
        </div>
      </section>}
{storefrontSettings.trackingEnabled && <section style={{order: storefrontSettings.sectionOrder?.indexOf('tracking') ?? 4}} id="tracking" className="tracking-section">
  <div className="tracking-box">
    <p className="eyebrow">{storefrontSettings.trackingEyebrow || 'ORDER TRACKING'}</p>
    <h2>{storefrontSettings.trackingTitle || 'Track Your Order.'}</h2>
    <p>{storefrontSettings.trackingDescription || 'Enter your Order ID and phone number to check your order status.'}</p>

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
        {trackingLoading ? 'CHECKING...' : (storefrontSettings.trackingButton || 'TRACK ORDER')}
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
</section>}
      <main id="shop" style={{order: storefrontSettings.sectionOrder?.indexOf('shop') ?? 5}} className="shop">
        <div className="section-heading">
          <div><p className="eyebrow">{storefrontSettings.shopEyebrow || 'THE CORE KITS STORE'}</p><h2>{storefrontSettings.shopTitle || 'Explore All Products'}</h2><p className="shop-intro">{storefrontSettings.shopDescription || 'Choose your team. Find your fit. Get match-day ready.'}</p></div>
          <span>{filtered.length} PRODUCTS</span>
        </div>
        <div className="shop-toolbar">
          <input id="product-search" className="search" placeholder={storefrontSettings.searchPlaceholder || 'Search your favourite team...'} value={search} onChange={e => setSearch(e.target.value)}/>
          <select className="shop-sort" value={sortBy} onChange={e=>setSortBy(e.target.value)} aria-label="Sort products">
            <option value="featured">Sort: Featured</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="name">Name: A to Z</option>
          </select>
          <select className="shop-sort" value={priceLimit} onChange={e=>setPriceLimit(e.target.value)} aria-label="Filter by maximum price">
            <option value="">Any price</option><option value="500">Under ৳500</option><option value="1000">Under ৳1,000</option><option value="1500">Under ৳1,500</option><option value="2000">Under ৳2,000</option>
          </select>
        </div>
        <div className="filters">
          <button className={category === 'All' ? 'active' : ''} onClick={() => setCategory('All')}>All products</button>
          {categories.map(c => <button key={c.id} className={category === c.id ? 'active' : ''} onClick={() => setCategory(c.id)}>{c.name}</button>)}
        </div>
        <div className="products">
          {filtered.map((p, index) => <ProductCard key={`${p.id}-shop-${index}`} product={p} onOpen={() => setSelectedProduct(p)} wished={wishlist.includes(p.id)} compared={compareItems.includes(p.id)} onWishlist={()=>toggleWishlist(p)} onCompare={()=>toggleCompare(p)}/>)}
        </div>

        {filtered.length === 0 && (
          <p className="empty">
            No kits found. New collection coming soon.
          </p>
        )}
      </main>
      </div>

      <footer className="site-footer">
        <div className="footer-main"><div><a className="logo" href="#">{(storefrontSettings.logoText || 'CORE KITS').split(' ')[0]}<span>{(storefrontSettings.logoText || 'CORE KITS').split(' ').slice(1).join(' ')}</span><i>.</i></a><p>{storefrontSettings.footerTagline}</p><small>{storefrontSettings.footerDescription}</small></div><div><b>{storefrontSettings.footerShopHeading || 'SHOP'}</b><a href="#shop">{storefrontSettings.allProductsLabel || 'All Products'}</a><a href="#collections">Collections</a><a href="#tracking">Track Order</a></div><div><b>{storefrontSettings.footerHelpHeading || 'HELP & SUPPORT'}</b><a href="#tracking">Order Tracking</a><a href="https://wa.me/966564905417" target="_blank" rel="noreferrer">{storefrontSettings.footerContactLabel || 'Contact on WhatsApp'}</a><button onClick={()=>setShowAccount(true)}>{storefrontSettings.footerAccountLabel || 'My Account'}</button></div></div>
        <div className="footer-bottom"><small>{storefrontSettings.copyrightText || '© 2026 CORE KITS. ALL RIGHTS RESERVED.'}</small><small>{storefrontSettings.footerBottomText || 'BUILT FOR THE LOVE OF THE GAME.'}</small></div>
      </footer>
<nav className="floating-nav">
  <button type="button" onClick={() => setShowAccount(true)}>♙<span>MY ACCOUNT</span></button>
  <button type="button" onClick={() => setShowCart(true)}>🛒<span>CART {cartItems.reduce((n,item)=>n+item.quantity,0) || ''}</span></button>
  <a href="#shop">⚽<span>SHOP</span></a>
  <button type="button" onClick={() => setShowMenu(true)}>☰<span>MENU</span></button>
</nav>
      {compareProducts.length > 0 && <div className="compare-dock"><span><b>{compareProducts.length}/3</b> products selected to compare</span><button onClick={()=>setShowCompare(true)}>COMPARE NOW</button><button className="compare-clear" onClick={()=>setCompareItems([])}>CLEAR</button></div>}
      {selectedProduct && (
        <div className="account-overlay product-overlay" onClick={() => setSelectedProduct(null)}>
          <section className="account-panel product-detail-panel" onClick={e => e.stopPropagation()}>
            <button className="account-close" onClick={() => setSelectedProduct(null)}>×</button>
            <ProductImageGallery product={selectedProduct}/>
            <p className="eyebrow">CORE KITS PRODUCT</p>
            <h2>{selectedProduct.name}</h2>
            <p>{selectedProduct.description || 'Premium football kit. Wear your passion.'}</p>
            <div className="detail-price">৳{selectedProduct.price}{selectedProduct.original_price > selectedProduct.price && <del>৳{selectedProduct.original_price}</del>}</div>
            <ProductDetailActions product={selectedProduct} onAdd={addToCart} onBuyNow={buyNow}/>
            <section className="product-reviews">
              <div className="reviews-heading">
                <div><p className="eyebrow">CUSTOMER FEEDBACK</p><h3>Reviews ({productReviews.length})</h3></div>
                {productReviews.length>0 && <strong>{(productReviews.reduce((sum,r)=>sum+Number(r.rating),0)/productReviews.length).toFixed(1)} / 5 ★</strong>}
              </div>
              <form className="review-form" onSubmit={submitProductReview}>
                <label htmlFor="review-rating">Your rating</label>
                <select id="review-rating" className="search" value={reviewRating} onChange={e=>setReviewRating(Number(e.target.value))}>
                  <option value="5">★★★★★ — Excellent</option><option value="4">★★★★☆ — Good</option><option value="3">★★★☆☆ — Average</option><option value="2">★★☆☆☆ — Poor</option><option value="1">★☆☆☆☆ — Very poor</option>
                </select>
                <label htmlFor="review-text">Your review</label>
                <textarea id="review-text" className="search" rows="3" maxLength="1200" placeholder="Share your experience with this product..." value={reviewText} onChange={e=>setReviewText(e.target.value)}/>
                <button className="account-action" type="submit" disabled={reviewBusy}>{reviewBusy?'SAVING...':customer?'SUBMIT REVIEW':'LOG IN TO REVIEW'}</button>
                {reviewMessage && <p className="review-message">{reviewMessage}</p>}
                {!customer && <p className="account-muted">Sign in to your CORE KITS account before submitting a review.</p>}
              </form>
              <div className="review-list">
                {productReviews.length===0 ? <p className="account-muted">No reviews yet. Be the first to share your experience.</p> : productReviews.map(review=><article className="review-item" key={review.id}>
                  <div><strong>{review.customer_name}</strong><span className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span></div>
                  <p>{review.review_text}</p><time>{new Date(review.created_at).toLocaleDateString()}</time>
                </article>)}
              </div>
            </section>
          </section>
        </div>
      )}
      {showWishlist && <div className="account-overlay" onClick={()=>setShowWishlist(false)}><section className="account-panel wishlist-panel" onClick={e=>e.stopPropagation()}><button className="account-close" onClick={()=>setShowWishlist(false)}>×</button><p className="eyebrow">SAVED FOR LATER</p><h2>My Wishlist</h2>{products.filter(p=>wishlist.includes(p.id)).length ? <div className="wishlist-list">{products.filter(p=>wishlist.includes(p.id)).map(p=><div className="wishlist-item" key={p.id}>{(p.image_urls?.[0]||p.image_url) ? <img src={p.image_urls?.[0]||p.image_url} alt={p.name}/> : <div className="wishlist-placeholder">CK</div>}<div><b>{p.name}</b><strong>৳{p.price||"—"}</strong><button onClick={()=>{setSelectedProduct(p);setShowWishlist(false);}}>VIEW PRODUCT</button></div><button className="wishlist-remove" onClick={()=>toggleWishlist(p)}>×</button></div>)}</div> : <p className="account-muted">Your wishlist is empty. Save products using the heart icon.</p>}</section></div>}
      {showCompare && <div className="account-overlay" onClick={()=>setShowCompare(false)}><section className="account-panel compare-panel" onClick={e=>e.stopPropagation()}><button className="account-close" onClick={()=>setShowCompare(false)}>×</button><p className="eyebrow">SIDE BY SIDE</p><h2>Compare Products</h2><div className="compare-grid">{compareProducts.map(p=><div key={p.id}><div className="compare-image">{p.image_urls?.[0] || p.image_url ? <img src={p.image_urls?.[0] || p.image_url} alt={p.name}/> : 'CORE KITS'}</div><b>{p.name}</b><strong>৳{p.price || '—'}</strong><small>{p.stock>0?'In stock':'Check availability'}</small><button onClick={()=>{setSelectedProduct(p);setShowCompare(false);}}>VIEW PRODUCT</button><button className="compare-remove" onClick={()=>setCompareItems(items=>items.filter(id=>id!==p.id))}>REMOVE</button></div>)}</div></section></div>}
      {showCart && (
        <div className="account-overlay" onClick={() => setShowCart(false)}>
          <section className="account-panel cart-panel" onClick={e => e.stopPropagation()}>
            <button className="account-close" onClick={() => setShowCart(false)}>×</button>
            <p className="eyebrow">YOUR SELECTION</p><h2>Shopping Cart</h2>
            {!cartItems.length ? <p className="account-muted">Your cart is empty.</p> : cartItems.map(item=>(
              <div className="cart-line" key={item.product.id + item.size + (item.sleeve || 'Short Sleeve') + (item.customName || '') + (item.customNumber || '')}>
                <div><strong>{item.product.name}</strong><small>Size: {item.size}{item.customName ? ` · Name: ${item.customName}` : ''}{item.customNumber ? ` · No: ${item.customNumber}` : ''} · {item.sleeve || 'Short Sleeve'} · ৳{item.product.price}</small></div>
                <input aria-label="Quantity" type="number" min="1" max={item.product.stock} value={item.quantity} onChange={e=>updateCartQuantity(item.product.id,item.size,Number(e.target.value),item.customName || '',item.customNumber || '',item.sleeve || 'Short Sleeve')}/>
                <button onClick={()=>updateCartQuantity(item.product.id,item.size,0,item.customName || '',item.customNumber || '',item.sleeve || 'Short Sleeve')}>Remove</button>
              </div>
            ))}
            {cartItems.length>0 && <>
              <div className="cart-total"><span>Subtotal</span><strong>৳{cartSubtotal}</strong></div>
              <button className="account-action" onClick={()=>{setShowCart(false);setShowCheckout(true);}}>PROCEED TO CHECKOUT</button>
            </>}
          </section>
        </div>
      )}
      {showCheckout && (
        <div className="account-overlay" onClick={() => setShowCheckout(false)}>
          <section className="account-panel checkout-panel" onClick={e => e.stopPropagation()}>
            <button className="account-close" onClick={() => setShowCheckout(false)}>×</button>
            <p className="eyebrow">SECURE ORDER</p><h2>Complete Your Order</h2>
            <form onSubmit={placeCheckoutOrder}>
              <input className="search" placeholder="Your full name" value={checkoutName} onChange={e=>setCheckoutName(e.target.value)} required/>
              <input className="search" placeholder="Phone number" value={checkoutPhone} onChange={e=>setCheckoutPhone(e.target.value)} required/>
              <textarea className="search" placeholder="Full delivery address" value={checkoutAddress} onChange={e=>setCheckoutAddress(e.target.value)} required/>
              <label>Delivery area</label>
              <select className="search" value={deliveryArea} onChange={e=>setDeliveryArea(e.target.value)}><option value="inside">Inside Noakhali — ৳70</option><option value="outside">Outside Noakhali — ৳130</option></select>
              <div className="cart-total"><span>Subtotal</span><strong>৳{cartSubtotal}</strong></div>
              <div className="cart-total"><span>Delivery</span><strong>৳{deliveryFee}</strong></div>
              <div className="cart-total grand-total"><span>Total</span><strong>৳{checkoutTotal}</strong></div>
              <button className="account-action" disabled={checkoutBusy}>{checkoutBusy ? 'PLACING ORDER...' : 'CONFIRM ORDER'}</button>
            </form>
          </section>
        </div>
      )}
      {checkoutResult && (
        <div className="account-overlay" onClick={()=>setCheckoutResult('')}>
          <section className="account-panel" onClick={e=>e.stopPropagation()}>
            <button className="account-close" onClick={()=>setCheckoutResult('')}>×</button>
            <p className="eyebrow">ORDER RECEIVED</p><h2>Thank you!</h2>
            <p>Your Order ID:</p><strong>{checkoutResult}</strong>
            <p className="account-muted">Save this ID and your phone number to track the order.</p>
            <a className="account-link" href="#tracking" onClick={()=>setCheckoutResult('')}>Track your order →</a>
          </section>
        </div>
      )}
      {showAccount && (
        <div className="account-overlay" onClick={() => setShowAccount(false)}>
          <section className="account-panel" onClick={e => e.stopPropagation()}>
            <button className="account-close" onClick={() => setShowAccount(false)} aria-label="Close account">×</button>
            <p className="eyebrow">CORE KITS MEMBER</p>
            <h2>My Account</h2>
            {customer ? (
              <>
                <p className="account-muted">You are signed in as</p>
                <strong className="account-email">{customer.email || 'Google account'}</strong>
                <a className="account-link" href="#tracking" onClick={() => setShowAccount(false)}>Track an order →</a>
                <div className="customer-order-history">
                  <h3>My Order History</h3>
                  {customerOrdersLoading ? <p className="account-muted">Loading your orders...</p> :
                    customerOrders.length ? customerOrders.map(order => (
                      <div className="cart-line" key={order.id}>
                        <div><strong>{order.product_name}</strong><small>Order: {order.id}</small>
                          <small>{new Date(order.created_at).toLocaleDateString()} · {order.status}</small></div>
                        <strong>৳{order.total_price}</strong>
                      </div>
                    )) : <p className="account-muted">No orders linked to this account yet. Sign in before checkout to save future orders here.</p>}
                </div>
                <button className="account-action" onClick={logout}>LOG OUT</button>
              </>
            ) : (
              <>
                <p className="account-muted">Use your Gmail and password to {customerAuthMode === 'signup' ? 'create a CORE KITS account' : 'log in'}.</p>
                <form onSubmit={customerPasswordAuth}>
                  <input className="search" type="email" placeholder="Enter your Gmail address" value={email} onChange={e => setEmail(e.target.value)} required />
                  <input className="search" type="password" placeholder="Password (minimum 6 characters)" value={password} onChange={e => setPassword(e.target.value)} minLength="6" autoComplete={customerAuthMode === 'signup' ? 'new-password' : 'current-password'} required />
                  <button className="account-action" disabled={customerAuthBusy}>{customerAuthBusy ? 'PLEASE WAIT...' : customerAuthMode === 'signup' ? 'CREATE ACCOUNT' : 'LOG IN'}</button>
                </form>
                <button type="button" className="detail-buy-now" disabled={customerAuthBusy} onClick={() => { setCustomerAuthMode(customerAuthMode === 'signup' ? 'login' : 'signup'); setMessage(''); setPassword(''); }}>
                  {customerAuthMode === 'signup' ? 'ALREADY HAVE AN ACCOUNT? LOG IN' : 'NEW CUSTOMER? CREATE ACCOUNT'}
                </button>
                {message && <p className="account-error">{message}</p>}
              </>
            )}
          </section>
        </div>
      )}
      {showMenu && (
        <div className="account-overlay" onClick={() => setShowMenu(false)}>
          <section className="account-panel menu-panel" onClick={e => e.stopPropagation()}>
            <button className="account-close" onClick={() => setShowMenu(false)} aria-label="Close menu">×</button>
            <p className="eyebrow">CORE KITS</p><h2>Menu</h2>
            <a href="#" onClick={() => setShowMenu(false)}>⌂　{storefrontSettings.navHome || 'Home'}</a>
            <a href="#shop" onClick={() => setShowMenu(false)}>⚽　{storefrontSettings.navShop || 'Shop Collection'}</a>
            <a href="#tracking" onClick={() => setShowMenu(false)}>▣　{storefrontSettings.navTracking || 'Track Order'}</a>
            <button onClick={() => { setShowMenu(false); setShowAccount(true); }}>♙　My Account</button>
            <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">☏　Contact Us</a>
          </section>
        </div>
      )}
      {isAdminRoute && showLogin && (
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

                <section className="website-customizer">
                  <div className="customizer-heading"><p className="eyebrow">STORE CONTROL</p><h3>Website Customization</h3><p>Control homepage content and sections from one place.</p></div>
                  {!settingsLoaded ? <p>Loading website settings...</p> : <form onSubmit={saveStorefrontSettings}>
                    <h4>Brand & Announcement</h4>
                    <label>Store logo text</label><input className="search" value={storefrontSettings.logoText} onChange={e=>setStorefrontSettings({...storefrontSettings,logoText:e.target.value})}/>
                    <label>Top announcement bar</label><input className="search" value={storefrontSettings.announcement} onChange={e=>setStorefrontSettings({...storefrontSettings,announcement:e.target.value})}/>
                    <h4>Navigation & Labels</h4>
                    <label>Home menu label</label><input className="search" value={storefrontSettings.navHome || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,navHome:e.target.value})}/>
                    <label>Shop menu label</label><input className="search" value={storefrontSettings.navShop || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,navShop:e.target.value})}/>
                    <label>Collections menu label</label><input className="search" value={storefrontSettings.navCollections || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,navCollections:e.target.value})}/>
                    <label>Track order menu label</label><input className="search" value={storefrontSettings.navTracking || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,navTracking:e.target.value})}/>
                    <label>Category strip heading</label><input className="search" value={storefrontSettings.categoryStripTitle || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,categoryStripTitle:e.target.value})}/>
                    <label>All products label</label><input className="search" value={storefrontSettings.allProductsLabel || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,allProductsLabel:e.target.value})}/>
                    <h4>Shop Page Content</h4>
                    <label>Shop eyebrow</label><input className="search" value={storefrontSettings.shopEyebrow || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,shopEyebrow:e.target.value})}/>
                    <label>Shop title</label><input className="search" value={storefrontSettings.shopTitle || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,shopTitle:e.target.value})}/>
                    <label>Shop description</label><input className="search" value={storefrontSettings.shopDescription || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,shopDescription:e.target.value})}/>
                    <label>Product search placeholder</label><input className="search" value={storefrontSettings.searchPlaceholder || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,searchPlaceholder:e.target.value})}/>
                    <h4>Custom Banner</h4>
                    {storefrontSettings.bannerUrl && <img className="customizer-banner-preview" src={storefrontSettings.bannerUrl} alt="Current banner"/>}
                    <label>Upload banner image</label><input className="search" type="file" accept="image/*" onChange={e=>setBannerFile(e.target.files?.[0] || null)}/>
                    {storefrontSettings.bannerUrl && <button type="button" className="admin-submit" onClick={()=>setStorefrontSettings({...storefrontSettings,bannerUrl:''})}>REMOVE BANNER</button>}
                    <h4>Customer Choice</h4>
                    <label className="customizer-check"><input type="checkbox" checked={!!storefrontSettings.choiceEnabled} onChange={e=>setStorefrontSettings({...storefrontSettings,choiceEnabled:e.target.checked})}/> Show section</label>
                    <label>Small heading</label><input className="search" value={storefrontSettings.choiceEyebrow} onChange={e=>setStorefrontSettings({...storefrontSettings,choiceEyebrow:e.target.value})}/>
                    <label>Section title</label><input className="search" value={storefrontSettings.choiceTitle} onChange={e=>setStorefrontSettings({...storefrontSettings,choiceTitle:e.target.value})}/>
                    <label>Product limit (1–12)</label><input className="search" type="number" min="1" max="12" value={storefrontSettings.choiceLimit} onChange={e=>setStorefrontSettings({...storefrontSettings,choiceLimit:Math.max(1,Math.min(12,Number(e.target.value)||1))})}/>
                    <label>Select products (empty selection = automatic latest products)</label>
                    <div className="customizer-product-list">{products.filter(p=>p.is_active).map(p=><label key={p.id} className="customizer-check"><input type="checkbox" checked={(storefrontSettings.choiceProductIds||[]).includes(p.id)} onChange={e=>setStorefrontSettings({...storefrontSettings,choiceProductIds:e.target.checked?[...(storefrontSettings.choiceProductIds||[]),p.id]:(storefrontSettings.choiceProductIds||[]).filter(id=>id!==p.id)})}/>{p.name}</label>)}</div>
                    <h4>Recommended Collection</h4>
                    <label className="customizer-check"><input type="checkbox" checked={!!storefrontSettings.recommendedEnabled} onChange={e=>setStorefrontSettings({...storefrontSettings,recommendedEnabled:e.target.checked})}/> Show section</label>
                    <label>Small heading</label><input className="search" value={storefrontSettings.recommendedEyebrow} onChange={e=>setStorefrontSettings({...storefrontSettings,recommendedEyebrow:e.target.value})}/>
                    <label>Section title</label><input className="search" value={storefrontSettings.recommendedTitle} onChange={e=>setStorefrontSettings({...storefrontSettings,recommendedTitle:e.target.value})}/>
                    <label>Category</label><select className="search" value={storefrontSettings.recommendedCategoryId} onChange={e=>setStorefrontSettings({...storefrontSettings,recommendedCategoryId:e.target.value})}><option value="all">All categories</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
                    <label>Product limit (1–12)</label><input className="search" type="number" min="1" max="12" value={storefrontSettings.recommendedLimit} onChange={e=>setStorefrontSettings({...storefrontSettings,recommendedLimit:Math.max(1,Math.min(12,Number(e.target.value)||1))})}/>
                    <h4>Homepage Section Order</h4>
                    <p className="customizer-help">Move sections up or down to change their order on the storefront.</p>
                    {(storefrontSettings.sectionOrder || ['choice','recommended','collections','tracking','shop']).map((key,index)=><div className="section-order-row" key={key}><strong>{({choice:'Customer Choice',recommended:'Recommended Collection',collections:'Explore Collections',tracking:'Order Tracking',shop:'All Products Shop'})[key]}</strong><span><button type="button" disabled={index===0} onClick={()=>{const next=[...(storefrontSettings.sectionOrder || ['choice','recommended','collections','tracking','shop'])];[next[index-1],next[index]]=[next[index],next[index-1]];setStorefrontSettings({...storefrontSettings,sectionOrder:next});}}>↑</button><button type="button" disabled={index===4} onClick={()=>{const next=[...(storefrontSettings.sectionOrder || ['choice','recommended','collections','tracking','shop'])];[next[index+1],next[index]]=[next[index],next[index+1]];setStorefrontSettings({...storefrontSettings,sectionOrder:next});}}>↓</button></span></div>)}
                    <h4>Other Homepage Sections</h4>
                    <label className="customizer-check"><input type="checkbox" checked={!!storefrontSettings.collectionsEnabled} onChange={e=>setStorefrontSettings({...storefrontSettings,collectionsEnabled:e.target.checked})}/> Show Explore Collections</label>
                    <label>Collections small heading</label><input className="search" value={storefrontSettings.collectionsEyebrow} onChange={e=>setStorefrontSettings({...storefrontSettings,collectionsEyebrow:e.target.value})}/>
                    <label>Collections title</label><input className="search" value={storefrontSettings.collectionsTitle} onChange={e=>setStorefrontSettings({...storefrontSettings,collectionsTitle:e.target.value})}/>
                    <label className="customizer-check"><input type="checkbox" checked={!!storefrontSettings.trackingEnabled} onChange={e=>setStorefrontSettings({...storefrontSettings,trackingEnabled:e.target.checked})}/> Show Order Tracking</label>
                    <h4>Order Tracking Content</h4>
                    <label>Tracking small heading</label><input className="search" value={storefrontSettings.trackingEyebrow || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,trackingEyebrow:e.target.value})}/>
                    <label>Tracking title</label><input className="search" value={storefrontSettings.trackingTitle || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,trackingTitle:e.target.value})}/>
                    <label>Tracking description</label><input className="search" value={storefrontSettings.trackingDescription || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,trackingDescription:e.target.value})}/>
                    <label>Tracking button text</label><input className="search" value={storefrontSettings.trackingButton || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,trackingButton:e.target.value})}/>
                    <h4>Footer</h4>
                    <label>Shop column heading</label><input className="search" value={storefrontSettings.footerShopHeading || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,footerShopHeading:e.target.value})}/>
                    <label>Help column heading</label><input className="search" value={storefrontSettings.footerHelpHeading || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,footerHelpHeading:e.target.value})}/>
                    <label>WhatsApp link label</label><input className="search" value={storefrontSettings.footerContactLabel || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,footerContactLabel:e.target.value})}/>
                    <label>Account link label</label><input className="search" value={storefrontSettings.footerAccountLabel || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,footerAccountLabel:e.target.value})}/>
                    <label>Copyright line</label><input className="search" value={storefrontSettings.copyrightText || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,copyrightText:e.target.value})}/>
                    <label>Footer bottom line</label><input className="search" value={storefrontSettings.footerBottomText || ''} onChange={e=>setStorefrontSettings({...storefrontSettings,footerBottomText:e.target.value})}/>
                    <label>Tagline</label><input className="search" value={storefrontSettings.footerTagline} onChange={e=>setStorefrontSettings({...storefrontSettings,footerTagline:e.target.value})}/>
                    <label>Description</label><textarea className="search" value={storefrontSettings.footerDescription} onChange={e=>setStorefrontSettings({...storefrontSettings,footerDescription:e.target.value})}/>
                    <h4>Storefront Colors</h4>
                    <div className="customizer-color-grid"><label>Background<input type="color" value={storefrontSettings.backgroundColor} onChange={e=>setStorefrontSettings({...storefrontSettings,backgroundColor:e.target.value})}/></label><label>Accent<input type="color" value={storefrontSettings.accentColor} onChange={e=>setStorefrontSettings({...storefrontSettings,accentColor:e.target.value})}/></label><label>Text<input type="color" value={storefrontSettings.textColor} onChange={e=>setStorefrontSettings({...storefrontSettings,textColor:e.target.value})}/></label></div>
                    <button className="admin-submit" disabled={settingsBusy}>{settingsBusy ? 'SAVING...' : 'SAVE WEBSITE CUSTOMIZATION'}</button>
                    <button type="button" className="admin-submit" onClick={()=>{setStorefrontSettings(defaultStorefrontSettings);setBannerFile(null);}}>RESET TO DEFAULTS</button>
                    {message && <p>{message}</p>}
                  </form>}
                </section>

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
    {o.order_items?.length ? <div><strong>Items ({o.order_items.length})</strong>
      {o.order_items.map(item => <p key={item.id || item.product_name}>{item.product_name} — Size {item.size} × {item.quantity} · ৳{item.line_total}</p>)}
    </div> : <><p><strong>Items:</strong> {o.product_name}</p><p><strong>Size:</strong> {o.size}</p><p><strong>Quantity:</strong> {o.quantity}</p></>}
    <p><strong>Subtotal:</strong> ৳{o.subtotal ?? '—'}</p>
    <p><strong>Delivery:</strong> ৳{o.delivery_fee ?? '—'}</p>
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

function ProductImageGallery({product}) {
  const images = product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : [];
  const [active,setActive] = useState(0);
  if (!images.length) return <div className="detail-gallery detail-gallery-empty"><div className="detail-main-image">CORE KITS.</div></div>;
  const current = images[Math.min(active,images.length-1)];
  return <div className="detail-gallery detail-gallery-interactive">
    <div className="detail-main-image"><img src={current} alt={product.name}/><span className="detail-image-count">{Math.min(active+1,images.length)} / {images.length}</span></div>
    {images.length>1 && <div className="detail-thumbnails">{images.map((url,i)=><button type="button" key={url+i} className={active===i?'active':''} onClick={()=>setActive(i)} aria-label={`View product image ${i+1}`}><img src={url} alt=""/></button>)}</div>}
  </div>;
}

function ProductCard({product, onOpen, wished, compared, onWishlist, onCompare}) {
  const hasSale = Number(product.original_price) > Number(product.price);
  const discount = hasSale ? Math.round(((Number(product.original_price)-Number(product.price))/Number(product.original_price))*100) : 0;
  return (
    <article className="product product-clickable">
      <div className="product-image" onClick={onOpen}>
        {product.image_urls?.length ? <img src={product.image_urls[0]} alt={product.name}/> : product.image_url ? <img src={product.image_url} alt={product.name}/> : <span>CORE KITS.</span>}
        {hasSale && <span className="product-sale">-{discount}%</span>}
        <div className="product-card-tools">
          <button type="button" className={wished?'is-active':''} aria-label="Add to wishlist" title="Wishlist" onClick={onWishlist}>{wished?'♥':'♡'}</button>
          <button type="button" className={compared?'is-active':''} aria-label="Compare product" title="Compare" onClick={onCompare}>⇄</button>
          <button type="button" aria-label="Quick view" title="Quick view" onClick={onOpen}>⌕</button>
        </div>
      </div>
      <div className="product-info">
        <div className="product-category">{product.stock > 0 ? 'READY TO SHIP' : 'CHECK AVAILABILITY'}</div>
        <h3 onClick={onOpen}>{product.name}</h3>
        <div className="product-price">
          <strong>{product.price ? `৳${product.price}` : 'Price on WhatsApp'}</strong>
          {hasSale && <span className="original-price">৳{product.original_price}</span>}
        </div>
        <button type="button" className="view-product-button" onClick={onOpen}>{product.stock > 0 ? 'SELECT OPTIONS' : 'VIEW DETAILS'} <b>↗</b></button>
      </div>
    </article>
  );
}

function ProductDetailActions({product,onAdd,onBuyNow}) {
  const [size,setSize]=useState(product.sizes?.[0] || '');
  const [sleeve,setSleeve]=useState('Short Sleeve');
  const [quantity,setQuantity]=useState(1);
  const [customName,setCustomName]=useState('');
  const [customNumber,setCustomNumber]=useState('');
  return <div className="detail-actions">
    <label>Choose size</label>
    <select className="search" value={size} onChange={e=>setSize(e.target.value)}>
      {(product.sizes?.length ? product.sizes : ['M','L','XL','XXL']).map(s=><option key={s} value={s}>{s}</option>)}
    </select>
    <label>Sleeve type</label>
    <select className="search" value={sleeve} onChange={e=>setSleeve(e.target.value)}>
      <option value="Short Sleeve">Short Sleeve</option>
      <option value="Long Sleeve">Long Sleeve</option>
    </select>
    <label>Custom name on jersey (optional)</label>
    <input className="search" maxLength="18" placeholder="e.g. NAJIM" value={customName} onChange={e=>setCustomName(e.target.value.toUpperCase())}/>
    <label>Custom number (optional)</label>
    <input className="search" inputMode="numeric" maxLength="2" placeholder="e.g. 10" value={customNumber} onChange={e=>setCustomNumber(e.target.value.replace(/\D/g,'').slice(0,2))}/>
    <label>Quantity</label>
    <input className="search" type="number" min="1" max={product.stock || 1} value={quantity} onChange={e=>setQuantity(Math.max(1,Math.min(Number(product.stock)||1,Number(e.target.value)||1)))}/>
    <button className="account-action" disabled={product.stock<1} onClick={()=>onAdd(product,size,quantity,customName.trim(),customNumber,sleeve)}>ADD TO CART</button>
    <button className="detail-buy-now" disabled={product.stock<1} onClick={()=>onBuyNow(product,size,quantity,customName.trim(),customNumber,sleeve)}>BUY NOW ↗</button>
    <p className="account-muted">Custom printing requests will be included with your order details.</p>
  </div>;
}
