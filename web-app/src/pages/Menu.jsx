import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, UtensilsCrossed, Upload, ImagePlus } from 'lucide-react';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem, uploadMenuItemImage } from '../api/client';
import '../styles/table-page.scss';

export default function Menu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '' });
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRefs = useRef({});

  const load = () => {
    const params = activeCategory === 'all' ? { page } : { category: activeCategory, page };
    getMenu(params).then((res) => {
      setItems(res.data);
      setPages(res.pages);
      setCategories(res.categories);
    });
  };

  useEffect(() => { load(); }, [activeCategory, page]);
  useEffect(() => setPage(1), [activeCategory]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    await createMenuItem({
      name: form.name,
      description: form.description,
      price: Number(form.price),
      category: form.category || 'Other'
    });
    setForm({ name: '', description: '', price: '', category: '' });
    load();
  };

  const toggleAvailable = async (item) => {
    await updateMenuItem(item.id, { available: !item.available });
    load();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from the menu? This cannot be undone.`)) return;
    await deleteMenuItem(id);
    load();
  };

  const handleImagePick = (id) => {
    fileInputRefs.current[id]?.click();
  };

  const handleImageChange = async (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(id);
    try {
      await uploadMenuItemImage(id, file);
      load();
    } catch (err) {
      window.alert(err?.response?.data?.error || 'Image upload failed. Check your Bunny.net configuration in the backend .env file.');
    } finally {
      setUploadingId(null);
      e.target.value = '';
    }
  };

  return (
    <div className="table-page">
      <div className="page-header">
        <div>
          <h1>Menu Management</h1>
          <p className="muted">Add, hide, or remove items guests can order. Images are stored on Bunny.net CDN.</p>
        </div>
      </div>

      <form className="menu-form card" onSubmit={handleAdd}>
        <input
          placeholder="Item name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Category (e.g. Chicken Dishes)"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          placeholder="Price (£)"
          type="number"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <input
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button className="btn btn-primary" type="submit"><Plus size={16} /> Add Item</button>
      </form>

      <div className="filter-tabs">
        <button className={activeCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}>
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={activeCategory === cat ? 'active' : ''}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="card empty-state">
          <UtensilsCrossed size={40} className="empty-state-icon" />
          <h3>No menu items yet</h3>
          <p className="muted">Add your first dish using the form above.</p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="menu-thumb-cell">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="menu-thumb" />
                      ) : (
                        <div className="menu-thumb menu-thumb-empty"><ImagePlus size={20} /></div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        ref={(el) => { fileInputRefs.current[item.id] = el; }}
                        onChange={(e) => handleImageChange(item.id, e)}
                      />
                      <button
                        type="button"
                        className="btn btn-outline thumb-upload-btn"
                        disabled={uploadingId === item.id}
                        onClick={() => handleImagePick(item.id)}
                      >
                        <Upload size={11} />
                        {uploadingId === item.id ? '...' : item.imageUrl ? 'Change' : 'Upload'}
                      </button>
                    </div>
                  </td>
                  <td>
                    <strong>{item.name}</strong>
                    {item.description && <div className="sub-text">{item.description}</div>}
                  </td>
                  <td>{item.category}</td>
                  <td>£{item.price.toFixed(2)}</td>
                  <td>
                    <button className={`badge ${item.available ? 'approved' : 'rejected'}`} onClick={() => toggleAvailable(item)}>
                      {item.available ? 'Available' : 'Hidden'}
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-danger" onClick={() => handleDelete(item.id, item.name)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="pagination">
          <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span>Page {page} of {pages}</span>
          <button className="btn btn-outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}