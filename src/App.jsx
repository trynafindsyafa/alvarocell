import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import logoImg from './assets/logo.png';
//import logoSvg from './assets/logo-alvarocell.svg'; // Mengimpor logo SVG
import { 
  ShoppingCart, 
  Package, 
  FolderPlus, 
  History, 
  TrendingUp,
  Plus, 
  Trash2, 
  Edit,
  Search,
  X,
  Calendar,
  Eye,
  Tag
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos'); // pos, products, categories, history, reports

  // Data dari Supabase
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  // Form State Kategori
  const [newCategory, setNewCategory] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // Form State Produk
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '',
    purchase_price: '',
    selling_price: '',
    stock: ''
  });
  const [editingProductId, setEditingProductId] = useState(null);

  // State Kasir / POS
  const [cart, setCart] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('Umum');
  const [paidAmount, setPaidAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // State Modal Item Manual / Nominal Bebas (Ditambah adminFee)
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [customItemForm, setCustomItemForm] = useState({
    name: '',
    price: '',
    adminFee: ''
  });

  // State Modal Edit Order
  const [editingOrder, setEditingOrder] = useState(null);
  const [editOrderForm, setEditOrderForm] = useState({
    cashier_name: '',
    payment_method: 'Cash',
    total_amount: 0
  });

  // State Filter & Pop-up Detail Laporan Keuntungan
  const [reportRange, setReportRange] = useState('daily');
  const [selectedDetailReport, setSelectedDetailReport] = useState(null);

  // Fetch Data Awal
  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (!error && data) setCategories(data);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('name');
    if (!error && data) setProducts(data);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .order('created_at', { ascending: false });
    if (!error && data) setOrders(data);
  };

  // --- HANDLER KATEGORI ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    if (editingCategoryId) {
      const { error } = await supabase
        .from('categories')
        .update({ name: newCategory })
        .eq('id', editingCategoryId);

      if (error) alert('Gagal memperbarui kategori: ' + error.message);
      else {
        setEditingCategoryId(null);
        setNewCategory('');
        fetchCategories();
      }
    } else {
      const { error } = await supabase.from('categories').insert([{ name: newCategory }]);
      if (error) alert('Gagal menambah kategori: ' + error.message);
      else {
        setNewCategory('');
        fetchCategories();
      }
    }
  };

  const handleEditCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setNewCategory(cat.name);
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert('Gagal menghapus kategori: ' + error.message);
    else fetchCategories();
  };

  // --- HANDLER PRODUK ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.category_id || !productForm.selling_price) {
      alert('Mohon isi nama, kategori, dan harga jual produk!');
      return;
    }

    const payload = {
      name: productForm.name,
      category_id: productForm.category_id,
      purchase_price: Number(productForm.purchase_price) || 0,
      selling_price: Number(productForm.selling_price) || 0,
      stock: Number(productForm.stock) || 0
    };

    if (editingProductId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProductId);
      if (error) alert('Gagal memperbarui produk: ' + error.message);
      else {
        setEditingProductId(null);
        setProductForm({ name: '', category_id: '', purchase_price: '', selling_price: '', stock: '' });
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from('products').insert([payload]);
      if (error) alert('Gagal menambah produk: ' + error.message);
      else {
        setProductForm({ name: '', category_id: '', purchase_price: '', selling_price: '', stock: '' });
        fetchProducts();
      }
    }
  };

  const handleEditProduct = (prod) => {
    setEditingProductId(prod.id);
    setProductForm({
      name: prod.name,
      category_id: prod.category_id,
      purchase_price: prod.purchase_price,
      selling_price: prod.selling_price,
      stock: prod.stock
    });
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert('Gagal menghapus produk: ' + error.message);
    else fetchProducts();
  };

  // --- HANDLER KASIR / POS ---
  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert('Stok barang ini habis!');
      return;
    }

    const existingIndex = cart.findIndex(item => item.id === product.id && !item.isCustom);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= product.stock) {
        alert('Jumlah melebihi stok yang tersedia!');
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantity: 1, isCustom: false }]);
    }
  };

  // HANDLER: Menambahkan Item/Tagihan Manual + Biaya Admin ke Keranjang[cite: 5, 7]
  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!customItemForm.name || customItemForm.price === '') {
      alert('Mohon isi nama layanan dan nominal harga!');
      return;
    }

    const priceNum = Number(customItemForm.price);
    const adminNum = Number(customItemForm.adminFee) || 0;

    if (isNaN(priceNum) || priceNum < 0) {
      alert('Harga harus berupa angka yang valid!');
      return;
    }

    // Total harga jual adalah Nominal Tagihan + Biaya Admin
    const totalSellingPrice = priceNum + adminNum;

    // Nama item otomatis mendeskripsikan biaya admin jika diisi agar kasir/pembeli jelas
    let finalItemName = customItemForm.name;
    if (adminNum > 0) {
      finalItemName += ` (Admin: Rp ${adminNum.toLocaleString('id-ID')})`;
    }

    const customItem = {
      id: 'custom-' + Date.now(),
      name: finalItemName,
      selling_price: totalSellingPrice,
      purchase_price: 0, // Biaya admin murni dianggap sebagai keuntungan/profit bersih
      stock: 999999,
      quantity: 1,
      isCustom: true
    };

    setCart([...cart, customItem]);
    setCustomItemForm({ name: '', price: '', adminFee: '' });
    setIsCustomItemModalOpen(false);
  };

  const updateCartQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (!item.isCustom && newQty > item.stock) {
          alert('Jumlah melebihi stok yang tersedia!');
          return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const handleCartQuantityChange = (id, value) => {
    const val = parseInt(value, 10);
    if (isNaN(val) || val <= 0) {
      setCart(cart.map(item => item.id === id ? { ...item, quantity: 1 } : item));
      return;
    }

    setCart(cart.map(item => {
      if (item.id === id) {
        if (!item.isCustom && val > item.stock) {
          alert(`Jumlah melebihi stok yang tersedia! (Stok: ${item.stock})`);
          return { ...item, quantity: item.stock };
        }
        return { ...item, quantity: val };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  const numericPaidAmount = Number(paidAmount) || 0;
  const changeOrDebt = numericPaidAmount - totalAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Keranjang masih kosong!');

    if (changeOrDebt < 0 && (!customerName || customerName.trim() === '' || customerName.toLowerCase() === 'umum')) {
      alert('Pembayaran kurang / berhutang! Mohon isi Nama Pembeli dengan lengkap.');
      return;
    }

    let finalMethod = paymentMethod;
    if (changeOrDebt < 0) {
      finalMethod = 'BON';
    }

    setLoading(true);

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          total_amount: totalAmount,
          payment_method: finalMethod,
          cashier_name: customerName || 'Umum'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.isCustom ? null : item.id,
        quantity: item.quantity,
        price: item.selling_price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      for (const item of cart) {
        if (!item.isCustom) {
          await supabase
            .from('products')
            .update({ stock: item.stock - item.quantity })
            .eq('id', item.id);
        }
      }

      if (changeOrDebt < 0) {
        alert(`Transaksi disimpan sebagai BON/Hutang!\nSisa Utang Pembeli: Rp ${Math.abs(changeOrDebt).toLocaleString('id-ID')}`);
      } else {
        alert(`Transaksi berhasil!\nKembalian: Rp ${changeOrDebt.toLocaleString('id-ID')}`);
      }

      setCart([]);
      setPaidAmount('');
      setCustomerName('Umum');
      fetchProducts();
      fetchOrders();
    } catch (err) {
      alert('Terjadi kesalahan saat transaksi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER RIWAYAT TRANSAKSI ---
  const handleOpenEditOrder = (order) => {
    setEditingOrder(order);
    setEditOrderForm({
      cashier_name: order.cashier_name || 'Umum',
      payment_method: order.payment_method || 'Cash',
      total_amount: order.total_amount || 0
    });
  };

  const handleSaveEditedOrder = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;

    const { error } = await supabase
      .from('orders')
      .update({
        cashier_name: editOrderForm.cashier_name,
        payment_method: editOrderForm.payment_method,
        total_amount: Number(editOrderForm.total_amount) || 0
      })
      .eq('id', editingOrder.id);

    if (error) {
      alert('Gagal mengupdate riwayat transaksi: ' + error.message);
    } else {
      alert('Riwayat transaksi berhasil diperbarui!');
      setEditingOrder(null);
      fetchOrders();
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!confirm('Yakin ingin menghapus riwayat transaksi ini?')) return;
    
    await supabase.from('order_items').delete().eq('order_id', orderId);
    const { error } = await supabase.from('orders').delete().eq('id', orderId);

    if (error) alert('Gagal menghapus transaksi: ' + error.message);
    else fetchOrders();
  };

  // Filter Produk
  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategoryFilter === 'all' || p.category_id === selectedCategoryFilter;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // --- KALKULASI LAPORAN KEUNTUNGAN ---
  const calculateProfitData = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayProfit = 0;
    let weeklyProfit = 0;
    let monthlyProfit = 0;

    let todayRevenue = 0;
    let weeklyRevenue = 0;
    let monthlyRevenue = 0;

    const groupedReports = {};

    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      let orderProfit = 0;
      let orderRevenue = order.total_amount || 0;

      order.order_items?.forEach(item => {
        const costPrice = item.products?.purchase_price || 0;
        const sellPrice = item.price || 0;
        const qty = item.quantity || 0;
        orderProfit += (sellPrice - costPrice) * qty;
      });

      if (orderDate >= today) {
        todayProfit += orderProfit;
        todayRevenue += orderRevenue;
      }
      if (orderDate >= oneWeekAgo) {
        weeklyProfit += orderProfit;
        weeklyRevenue += orderRevenue;
      }
      if (orderDate >= firstDayOfMonth) {
        monthlyProfit += orderProfit;
        monthlyRevenue += orderRevenue;
      }

      let groupKey = '';
      if (reportRange === 'daily') {
        groupKey = orderDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      } else if (reportRange === 'weekly') {
        const weekNum = Math.ceil(orderDate.getDate() / 7);
        groupKey = `Minggu ke-${weekNum} (${orderDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })})`;
      } else if (reportRange === 'monthly') {
        groupKey = orderDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      }

      if (!groupedReports[groupKey]) {
        groupedReports[groupKey] = { revenue: 0, profit: 0, count: 0, transactions: [] };
      }
      groupedReports[groupKey].revenue += orderRevenue;
      groupedReports[groupKey].profit += orderProfit;
      groupedReports[groupKey].count += 1;
      groupedReports[groupKey].transactions.push({
        ...order,
        calculatedProfit: orderProfit
      });
    });

    return {
      todayProfit,
      weeklyProfit,
      monthlyProfit,
      todayRevenue,
      weeklyRevenue,
      monthlyRevenue,
      groupedReports
    };
  };

  const profitStats = calculateProfitData();

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col font-sans">
      {/* HEADER NAVIGASI - FULL WIDTH & LOGO */}
      <header className="bg-indigo-600 text-white shadow-md p-3 sm:p-4 sticky top-0 z-40 w-full">
        <div className="w-full px-2 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <img 
              src={logoImg} 
              alt="Alvarocell Logo" 
              className="w-16 h-16 sm:w-18 sm:h-18 object-contain" 
            />
            <h1 className="text-xl sm:text-3xl font-bold tracking-wide">Alvarocell</h1>
          </div>

          <nav className="flex w-full md:w-auto overflow-x-auto pb-1 md:pb-0 gap-1.5 sm:gap-2 no-scrollbar justify-start md:justify-end">
            <button 
              onClick={() => setActiveTab('pos')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg font-medium flex items-center gap-1.5 whitespace-nowrap transition ${activeTab === 'pos' ? 'bg-white text-indigo-600 shadow' : 'hover:bg-indigo-500 text-white'}`}
            >
              <ShoppingCart className="w-4 h-4" /> Kasir
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg font-medium flex items-center gap-1.5 whitespace-nowrap transition ${activeTab === 'products' ? 'bg-white text-indigo-600 shadow' : 'hover:bg-indigo-500 text-white'}`}
            >
              <Package className="w-4 h-4" /> Produk
            </button>
            <button 
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg font-medium flex items-center gap-1.5 whitespace-nowrap transition ${activeTab === 'categories' ? 'bg-white text-indigo-600 shadow' : 'hover:bg-indigo-500 text-white'}`}
            >
              <FolderPlus className="w-4 h-4" /> Kategori
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg font-medium flex items-center gap-1.5 whitespace-nowrap transition ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow' : 'hover:bg-indigo-500 text-white'}`}
            >
              <History className="w-4 h-4" /> Riwayat
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg font-medium flex items-center gap-1.5 whitespace-nowrap transition ${activeTab === 'reports' ? 'bg-white text-indigo-600 shadow' : 'hover:bg-indigo-500 text-white'}`}
            >
              <TrendingUp className="w-4 h-4" /> Keuntungan
            </button>
          </nav>
        </div>
      </header>

      {/* KONTEN UTAMA - FULL WIDTH */}
      <main className="flex-1 p-3 sm:p-5 md:p-6 w-full">
        
        {/* TAB 1: KASIR / POS */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Cari nama produk..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* TOMBOL TAMBAH ITEM MANUAL / NOMINAL BEBAS */}
                <button 
                  onClick={() => setIsCustomItemModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm whitespace-nowrap"
                >
                  <Tag className="w-4 h-4" /> + Item Manual
                </button>

                <select 
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => addToCart(p)}
                    className={`bg-white p-3 sm:p-4 rounded-xl shadow-sm border hover:shadow-md transition cursor-pointer flex flex-col justify-between ${p.stock <= 0 ? 'opacity-50 pointer-events-none bg-gray-50' : ''}`}
                  >
                    <div>
                      <span className="text-[10px] sm:text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded">
                        {p.categories?.name || 'Umum'}
                      </span>
                      <h3 className="font-bold text-xs sm:text-sm text-gray-800 mt-2 line-clamp-2">{p.name}</h3>
                    </div>
                    <div className="mt-3 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500">Stok: {p.stock}</p>
                        <p className="font-bold text-xs sm:text-sm text-indigo-600">Rp {p.selling_price?.toLocaleString('id-ID')}</p>
                      </div>
                      <button className="p-1 sm:p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition">
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="col-span-full text-center py-8 text-gray-500 text-sm">Tidak ada produk ditemukan.</p>
                )}
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 border-b pb-3 mb-3 sm:mb-4 flex items-center justify-between">
                <span>Keranjang Belanja</span>
                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">{cart.length} barang</span>
              </h2>

              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[300px] lg:max-h-[400px] pr-1">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-xs sm:text-sm text-gray-800 line-clamp-1">{item.name}</h4>
                        {item.isCustom && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 font-semibold px-1.5 py-0.2 rounded">Manual</span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500">Rp {item.selling_price.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateCartQuantity(item.id, -1)} className="w-5 h-5 sm:w-6 sm:h-6 bg-white border rounded flex items-center justify-center text-xs font-bold hover:bg-gray-100">-</button>
                      
                      {/* INPUT MANUAL JUMLAH BARANG */}
                      <input 
                        type="number" 
                        min="1" 
                        max={item.isCustom ? 999999 : item.stock}
                        value={item.quantity} 
                        onChange={(e) => handleCartQuantityChange(item.id, e.target.value)}
                        className="w-12 text-center text-xs sm:text-sm font-bold border rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                      />

                      <button onClick={() => updateCartQuantity(item.id, 1)} className="w-5 h-5 sm:w-6 sm:h-6 bg-white border rounded flex items-center justify-center text-xs font-bold hover:bg-gray-100">+</button>
                      
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 ml-1">
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <p className="text-center text-gray-400 py-8 text-xs sm:text-sm">Keranjang belanja kosong</p>
                )}
              </div>

              <div className="border-t pt-3 mt-3 space-y-2.5">
                <div className="flex justify-between items-center text-gray-600 text-xs sm:text-sm">
                  <span>Nama Pembeli:</span>
                  <input 
                    type="text" 
                    placeholder="Nama Pembeli"
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="border-b text-right text-gray-800 font-medium focus:outline-none focus:border-indigo-500 px-1 py-0.5 w-36"
                  />
                </div>
                <div className="flex justify-between items-center text-gray-600 text-xs sm:text-sm">
                  <span>Metode Bayar:</span>
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="border rounded px-2 py-1 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Cash">Cash (Tunai)</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Transfer">Transfer Bank</option>
                    <option value="BON">BON (Hutang Full)</option>
                  </select>
                </div>

                <div className="flex justify-between items-center text-gray-600 text-xs sm:text-sm">
                  <span>Uang Dibayarkan:</span>
                  <input 
                    type="number" 
                    placeholder="Rp 0"
                    value={paidAmount} 
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="border rounded px-2 py-1 text-right text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32 text-xs sm:text-sm"
                  />
                </div>

                <div className="flex justify-between text-sm sm:text-base font-bold text-gray-800 pt-2 border-t">
                  <span>Total Belanja:</span>
                  <span className="text-indigo-600">Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>

                {paidAmount !== '' && (
                  <div className={`flex justify-between text-xs sm:text-sm font-bold p-2 rounded-lg ${
                    changeOrDebt < 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  }`}>
                    <span>{changeOrDebt < 0 ? 'Sisa Utang (BON):' : 'Kembalian:'}</span>
                    <span>Rp {Math.abs(changeOrDebt).toLocaleString('id-ID')}</span>
                  </div>
                )}

                <button 
                  onClick={handleCheckout}
                  disabled={loading || cart.length === 0}
                  className={`w-full text-white font-bold py-2.5 sm:py-3 rounded-xl transition disabled:opacity-50 text-xs sm:text-sm ${
                    changeOrDebt < 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {loading ? 'Memproses...' : (changeOrDebt < 0 ? 'Simpan Transaksi (BON)' : 'Proses Pembayaran')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAJEMEN PRODUK */}
        {activeTab === 'products' && (
          <div className="space-y-4 sm:space-y-6 w-full">
            <form onSubmit={handleAddProduct} className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">
                {editingProductId ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <input 
                  type="text" 
                  placeholder="Nama Produk" 
                  value={productForm.name} 
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  className="p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <select 
                  value={productForm.category_id} 
                  onChange={(e) => setProductForm({...productForm, category_id: e.target.value})}
                  className="p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  placeholder="Harga Modal (Rp)" 
                  value={productForm.purchase_price} 
                  onChange={(e) => setProductForm({...productForm, purchase_price: e.target.value})}
                  className="p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input 
                  type="number" 
                  placeholder="Harga Jual (Rp)" 
                  value={productForm.selling_price} 
                  onChange={(e) => setProductForm({...productForm, selling_price: e.target.value})}
                  className="p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input 
                  type="number" 
                  placeholder="Stok" 
                  value={productForm.stock} 
                  onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                  className="p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="bg-indigo-600 text-white font-semibold px-5 py-2 rounded-lg text-xs sm:text-sm hover:bg-indigo-700 transition">
                  {editingProductId ? 'Simpan Perubahan' : 'Simpan Produk'}
                </button>
                {editingProductId && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditingProductId(null);
                      setProductForm({ name: '', category_id: '', purchase_price: '', selling_price: '', stock: '' });
                    }}
                    className="bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg text-xs sm:text-sm hover:bg-gray-400 transition"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600">Nama Produk</th>
                    <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600">Kategori</th>
                    <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600">Harga Modal</th>
                    <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600">Harga Jual</th>
                    <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600">Stok</th>
                    <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs sm:text-sm">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-800">{p.name}</td>
                      <td className="p-3 text-gray-600">{p.categories?.name || '-'}</td>
                      <td className="p-3 text-gray-600">Rp {p.purchase_price?.toLocaleString('id-ID')}</td>
                      <td className="p-3 font-bold text-indigo-600">Rp {p.selling_price?.toLocaleString('id-ID')}</td>
                      <td className="p-3 font-semibold">{p.stock}</td>
                      <td className="p-3 flex justify-center gap-1.5">
                        <button onClick={() => handleEditProduct(p)} className="p-1.5 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-gray-400">Belum ada data produk.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MANAJEMEN KATEGORI */}
        {activeTab === 'categories' && (
          <div className="w-full space-y-4 sm:space-y-6">
            <form onSubmit={handleAddCategory} className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200 flex gap-2 sm:gap-3 max-w-xl mx-auto">
              <input 
                type="text" 
                placeholder="Nama Kategori Baru" 
                value={newCategory} 
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 p-2 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button type="submit" className="bg-indigo-600 text-white font-semibold px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm hover:bg-indigo-700 transition">
                {editingCategoryId ? 'Update' : 'Tambah'}
              </button>
              {editingCategoryId && (
                <button 
                  type="button" 
                  onClick={() => { setEditingCategoryId(null); setNewCategory(''); }}
                  className="bg-gray-300 text-gray-700 font-semibold px-3 py-2 rounded-lg text-xs sm:text-sm hover:bg-gray-400 transition"
                >
                  Batal
                </button>
              )}
            </form>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-xl mx-auto">
              <ul className="divide-y text-xs sm:text-sm">
                {categories.map(c => (
                  <li key={c.id} className="p-3.5 sm:p-4 flex justify-between items-center text-gray-800 font-medium">
                    <span>{c.name}</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleEditCategory(c)} className="p-1.5 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteCategory(c.id)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
                {categories.length === 0 && (
                  <li className="p-4 text-center text-gray-400">Belum ada kategori.</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 4: RIWAYAT PENJUALAN */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600">Tanggal</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600">Nama Pembeli</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600">Metode / Status</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600">Detail Barang</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600">Total Belanja</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs sm:text-sm">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-600 whitespace-nowrap">
                      {new Date(o.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 font-medium text-gray-800">{o.cashier_name || 'Umum'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold ${
                        o.payment_method === 'BON' 
                          ? 'bg-red-100 text-red-700 border border-red-200' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {o.payment_method === 'BON' ? 'BON (Hutang)' : o.payment_method}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">
                      {o.order_items?.map(item => `${item.products?.name || item.name || 'Layanan/Item'} (${item.quantity}x)`).join(', ')}
                    </td>
                    <td className="p-3 font-bold text-indigo-600 whitespace-nowrap">
                      Rp {o.total_amount?.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 flex justify-center gap-1.5">
                      <button 
                        onClick={() => handleOpenEditOrder(o)} 
                        title="Edit / Pelunasan"
                        className="p-1.5 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(o.id)} 
                        title="Hapus"
                        className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-400">Belum ada riwayat transaksi.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: LAPORAN KEUNTUNGAN */}
        {activeTab === 'reports' && (
          <div className="space-y-4 sm:space-y-6 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
              <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-green-500">
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Keuntungan Hari Ini</p>
                <h3 className="text-xl sm:text-2xl font-bold text-green-600 mt-1">
                  Rp {profitStats.todayProfit.toLocaleString('id-ID')}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5">Omzet: Rp {profitStats.todayRevenue.toLocaleString('id-ID')}</p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-indigo-500">
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Keuntungan Minggu Ini</p>
                <h3 className="text-xl sm:text-2xl font-bold text-indigo-600 mt-1">
                  Rp {profitStats.weeklyProfit.toLocaleString('id-ID')}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5">Omzet: Rp {profitStats.weeklyRevenue.toLocaleString('id-ID')}</p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-purple-500">
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Keuntungan Bulan Ini</p>
                <h3 className="text-xl sm:text-2xl font-bold text-purple-600 mt-1">
                  Rp {profitStats.monthlyProfit.toLocaleString('id-ID')}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5">Omzet: Rp {profitStats.monthlyRevenue.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200 w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" /> Rincian Rekap Laporan
                </h2>

                <div className="flex border rounded-lg overflow-hidden bg-gray-50 p-1 w-full sm:w-auto justify-center">
                  <button 
                    onClick={() => setReportRange('daily')}
                    className={`flex-1 sm:flex-none px-3 py-1 text-xs font-semibold rounded-md transition ${reportRange === 'daily' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'}`}
                  >
                    Harian
                  </button>
                  <button 
                    onClick={() => setReportRange('weekly')}
                    className={`flex-1 sm:flex-none px-3 py-1 text-xs font-semibold rounded-md transition ${reportRange === 'weekly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'}`}
                  >
                    Mingguan
                  </button>
                  <button 
                    onClick={() => setReportRange('monthly')}
                    className={`flex-1 sm:flex-none px-3 py-1 text-xs font-semibold rounded-md transition ${reportRange === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'}`}
                  >
                    Bulanan
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600">Periode</th>
                      <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600">Jumlah Transaksi</th>
                      <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600">Total Omzet</th>
                      <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600">Keuntungan Bersih</th>
                      <th className="p-3 text-xs sm:text-sm font-semibold text-gray-600 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs sm:text-sm">
                    {Object.keys(profitStats.groupedReports).map(key => (
                      <tr key={key} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedDetailReport({ period: key, data: profitStats.groupedReports[key] })}>
                        <td className="p-3 font-medium text-gray-800">{key}</td>
                        <td className="p-3 text-gray-600">{profitStats.groupedReports[key].count} Transaksi</td>
                        <td className="p-3 font-semibold text-gray-800">
                          Rp {profitStats.groupedReports[key].revenue.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 font-bold text-green-600">
                          Rp {profitStats.groupedReports[key].profit.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDetailReport({ period: key, data: profitStats.groupedReports[key] });
                            }}
                            className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition flex items-center gap-1 text-xs mx-auto font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" /> Lihat Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                    {Object.keys(profitStats.groupedReports).length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-400">Belum ada data transaksi untuk dihitung.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL POP-UP: TAMBAH ITEM MANUAL / NOMINAL BEBAS + BIAYA ADMIN */}
      {isCustomItemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-5 sm:p-6 relative">
            <button 
              onClick={() => setIsCustomItemModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">Tambah Item / Layanan Manual</h3>
            <p className="text-xs text-gray-500 mb-4">Digunakan untuk token listrik, tagihan, atau jasa nominal bebas.</p>

            <form onSubmit={handleAddCustomItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Layanan / Keterangan</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Token Listrik 100k / Listrik Pak Budi" 
                  value={customItemForm.name} 
                  onChange={(e) => setCustomItemForm({ ...customItemForm, name: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nominal Harga (Rp)</label>
                <input 
                  type="number" 
                  placeholder="Contoh: 100000" 
                  value={customItemForm.price} 
                  onChange={(e) => setCustomItemForm({ ...customItemForm, price: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs sm:text-sm"
                  required
                />
              </div>

              {/* FIELD BARU: BIAYA ADMIN / TAMBAHAN */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Biaya Admin / Tambahan (Rp) <span className="text-gray-400 font-normal">(Opsional)</span></label>
                <input 
                  type="number" 
                  placeholder="Contoh: 2500" 
                  value={customItemForm.adminFee} 
                  onChange={(e) => setCustomItemForm({ ...customItemForm, adminFee: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs sm:text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsCustomItemModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition text-xs sm:text-sm"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition text-xs sm:text-sm"
                >
                  Masukkan ke Keranjang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP DETAIL LAPORAN */}
      {selectedDetailReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-4 sm:p-6 relative max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setSelectedDetailReport(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b pb-3 mb-3 sm:mb-4 pr-6">
              <h3 className="text-base sm:text-xl font-bold text-gray-800">Rincian Transaksi - {selectedDetailReport.period}</h3>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                <span>Total: <b className="text-gray-700">{selectedDetailReport.data.count} Transaksi</b></span> | 
                <span>Omzet: <b className="text-gray-700">Rp {selectedDetailReport.data.revenue.toLocaleString('id-ID')}</b></span> | 
                <span>Keuntungan: <b className="text-green-600">Rp {selectedDetailReport.data.profit.toLocaleString('id-ID')}</b></span>
              </p>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-auto pr-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    <th className="p-2.5 text-[10px] sm:text-xs font-semibold text-gray-600">Waktu</th>
                    <th className="p-2.5 text-[10px] sm:text-xs font-semibold text-gray-600">Pembeli</th>
                    <th className="p-2.5 text-[10px] sm:text-xs font-semibold text-gray-600">Status</th>
                    <th className="p-2.5 text-[10px] sm:text-xs font-semibold text-gray-600">Detail Barang</th>
                    <th className="p-2.5 text-[10px] sm:text-xs font-semibold text-gray-600">Omzet</th>
                    <th className="p-2.5 text-[10px] sm:text-xs font-semibold text-gray-600">Keuntungan</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs sm:text-sm">
                  {selectedDetailReport.data.transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="p-2.5 text-[10px] sm:text-xs text-gray-600 whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-2.5 font-medium text-gray-800">{tx.cashier_name || 'Umum'}</td>
                      <td className="p-2.5 text-[10px] sm:text-xs">
                        <span className={`px-2 py-0.5 rounded font-semibold ${
                          tx.payment_method === 'BON' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {tx.payment_method}
                        </span>
                      </td>
                      <td className="p-2.5 text-[10px] sm:text-xs text-gray-600">
                        <ul className="list-disc list-inside space-y-0.5">
                          {tx.order_items?.map(item => (
                            <li key={item.id}>
                              {item.products?.name || item.name || 'Layanan/Item'} ({item.quantity}x @ Rp {item.price?.toLocaleString('id-ID')})
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-2.5 font-semibold text-gray-800 whitespace-nowrap">
                        Rp {tx.total_amount?.toLocaleString('id-ID')}
                      </td>
                      <td className="p-2.5 font-bold text-green-600 whitespace-nowrap">
                        Rp {tx.calculatedProfit?.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t pt-3 mt-3 flex justify-end">
              <button 
                onClick={() => setSelectedDetailReport(null)}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition text-xs sm:text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POP-UP EDIT TRANSAKSI / PELUNASAN BON */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-5 sm:p-6 relative">
            <button 
              onClick={() => setEditingOrder(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">Pelunasan / Edit Transaksi</h3>

            <form onSubmit={handleSaveEditedOrder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Pembeli</label>
                <input 
                  type="text" 
                  value={editOrderForm.cashier_name} 
                  onChange={(e) => setEditOrderForm({ ...editOrderForm, cashier_name: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status / Metode Pembayaran</label>
                <select 
                  value={editOrderForm.payment_method} 
                  onChange={(e) => setEditOrderForm({ ...editOrderForm, payment_method: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs sm:text-sm bg-white"
                >
                  <option value="Cash">Cash (Tunai - Lunas)</option>
                  <option value="QRIS">QRIS (Lunas)</option>
                  <option value="Transfer">Transfer Bank (Lunas)</option>
                  <option value="BON">BON (Hutang)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Total Pembayaran (Rp)</label>
                <input 
                  type="number" 
                  value={editOrderForm.total_amount} 
                  onChange={(e) => setEditOrderForm({ ...editOrderForm, total_amount: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition text-xs sm:text-sm"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition text-xs sm:text-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}