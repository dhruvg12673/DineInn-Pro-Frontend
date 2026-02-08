import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Edit, Plus, X, Upload, Trash2, FolderPlus, AlertCircle } from 'lucide-react';
import axios from 'axios';
import './MenuEditor.css';

const API_URL = 'http://localhost:5000'; // Your backend URL

const MenuEditor = () => {
  // --- STATE MANAGEMENT ---
  const [menuData, setMenuData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  // --- RESTAURANT ID FROM LOCAL STORAGE ---
  const user = JSON.parse(localStorage.getItem('user'));
  const restaurantId = user?.restaurantid;

  // --- DATA FETCHING ---
  const fetchMenuData = useCallback(async () => {
    if (!restaurantId) {
        setIsLoading(false);
        setError("Login session expired or Restaurant ID not found. Please log in again.");
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [menuRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/api/menuitems-grouped`, { params: { restaurantId } }),
        axios.get(`${API_URL}/api/menu-item-categories`, { params: { restaurantId } })
      ]);

      setMenuData(menuRes.data);
      setCategories(categoriesRes.data);

    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch data.';
      setError(errorMessage);
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchMenuData();
  }, [restaurantId]);

  const toggleCategory = (categoryName) => {
    setMenuData(prev => prev.map(cat => 
      cat.category === categoryName ? { ...cat, isOpen: !cat.isOpen } : cat
    ));
  };

  // --- CATEGORY MANAGEMENT ---
  const handleAddCategoryClick = () => {
    setNewCategoryName('');
    setIsCategoryModalOpen(true);
  };

  const handleSaveNewCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;
    if (categories.includes(trimmedName) || trimmedName === 'Uncategorized') {
        alert('Category already exists!');
        return;
    }
    setCategories(prev => [...prev, trimmedName].sort());
    if (isItemModalOpen) {
        setFormData(prev => ({ ...prev, category: trimmedName }));
    }
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = async (categoryName) => {
    if (window.confirm(`Are you sure you want to delete the "${categoryName}" category? All items within it will be moved to "Uncategorized".`)) {
        try {
            await axios.delete(`${API_URL}/api/menu-item-categories`, {
                data: { restaurantId, categoryName }
            });
            await fetchMenuData();
        } catch (err) {
            alert(`Error: ${err.response?.data?.error || err.message}`);
        }
    }
  };

  // --- MENU ITEM MANAGEMENT ---
  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({
      name: '', price: '', category: categories[0] || 'Uncategorized',
      ingredients: '', description: '', image: null
    });
    setPreviewImage(null);
    setIsItemModalOpen(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name, price: parseFloat(item.price).toFixed(2),
      category: item.category, ingredients: item.ingredients || '',
      description: item.description || '', image: item.image
    });
    setPreviewImage(item.image);
    setIsItemModalOpen(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
        try {
            await axios.delete(`${API_URL}/api/menuitems/${itemId}`);
            await fetchMenuData();
        } catch (err) {
            alert(`Error: ${err.response?.data?.error || err.message}`);
        }
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.category) {
        alert("Dish Name, Price, and Category are required.");
        return;
    }
    const payload = {
        itemname: formData.name,
        itemdescription: formData.description,
        price: Number(formData.price),
        category: formData.category,
        ingredients: formData.ingredients,
        image: formData.image,
        restaurantid: restaurantId,
        menuid: restaurantId,
    };

    try {
        if (editingItem) {
            await axios.put(`${API_URL}/api/menuitems/${editingItem.id}`, payload);
        } else {
            await axios.post(`${API_URL}/api/menuitems`, payload);
        }
        setIsItemModalOpen(false);
        await fetchMenuData();
    } catch (err) {
        alert(`Failed to save menu item: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        setPreviewImage(imageUrl);
        setFormData(prev => ({ ...prev, image: imageUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
    setFormData(prev => ({ ...prev, image: null }));
  };

  const handleCancel = () => {
    setIsItemModalOpen(false);
    setEditingItem(null);
    setPreviewImage(null);
  };

  const handleCancelCategory = () => {
    setIsCategoryModalOpen(false);
    setNewCategoryName('');
  };

  // --- RENDER LOGIC ---
  if (isLoading) return <div className="menu-editor-loading">Loading your menu...</div>;
  if (error) return <div className="menu-editor-error"><AlertCircle/> {error}</div>;

  return (
    <div className="menu-editor">
      <header className="menu-editor__header">
        <div className="menu-editor__header-container">
          <div className="menu-editor__header-content">
            <h1 className="menu-editor__header-title">Menu Editor</h1>
            <div className="menu-editor__header-actions">
              <button onClick={handleAddCategoryClick} className="menu-editor__add-category-btn">
                <FolderPlus size={18} /> Add Category
              </button>
              <button onClick={handleAddItem} className="menu-editor__add-btn">
                <Plus size={18} /> Add New Item
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="menu-editor__main-content">
        <div className="menu-editor__categories-container">
          {menuData.map((category) => (
            <div key={category.category} className="menu-editor__category-card">
              <div className="menu-editor__category-header-wrapper">
                <button onClick={() => toggleCategory(category.category)} className="menu-editor__category-header">
                  <h2 className="menu-editor__category-title">{category.category}</h2>
                  <div className="menu-editor__category-info">
                    <span className="menu-editor__item-count">{category.items.length} items</span>
                    <div className="menu-editor__chevron-icon">
                      {category.isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </button>
                {category.category !== 'Uncategorized' && (
                  <button onClick={() => handleDeleteCategory(category.category)} className="menu-editor__delete-category-btn" title={`Delete category "${category.category}"`}>
                      <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              <div className={`menu-editor__category-items ${category.isOpen ? 'open' : 'closed'}`}>
                <div className="menu-editor__items-container">
                  <div className="menu-editor__items-grid">
                    {category.items.map((item) => (
                      <div key={item.id} className="menu-editor__item-card">
                        <div className="menu-editor__item-content">
                          <div className="menu-editor__item-main">
                            <div className="menu-editor__item-header">
                              {item.image && <img src={item.image} alt={item.name} className="menu-editor__item-image" />}
                              <div className="menu-editor__item-info">
                                <h3 className="menu-editor__item-name">{item.name}</h3>
                                <p className="menu-editor__item-description">{item.description}</p>
                              </div>
                            </div>
                            {item.ingredients && <p className="menu-editor__item-ingredients"><strong>Ingredients:</strong> {item.ingredients}</p>}
                          </div>
                          <div className="menu-editor__item-actions">
                            <span className="menu-editor__item-price">₹{parseFloat(item.price).toFixed(2)}</span>
                            <button onClick={() => handleEditItem(item)} className="menu-editor__edit-btn"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteItem(item.id)} className="menu-editor__delete-btn"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {isCategoryModalOpen && (
        <div className="menu-editor__modal-overlay">
          <div className="menu-editor__modal-container">
            <div className="menu-editor__modal-header">
              <h3 className="menu-editor__modal-title">Add New Category</h3>
              <button onClick={handleCancelCategory} className="menu-editor__close-btn"><X size={18} /></button>
            </div>
            <div className="menu-editor__modal-body">
              <div className="menu-editor__form-group">
                <label className="menu-editor__form-label">Category Name</label>
                <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="menu-editor__form-input" placeholder="Enter category name" autoFocus/>
              </div>
            </div>
            <div className="menu-editor__modal-footer">
              <button onClick={handleCancelCategory} className="menu-editor__cancel-btn">Cancel</button>
              <button onClick={handleSaveNewCategory} disabled={!newCategoryName.trim()} className="menu-editor__save-btn">Add Category</button>
            </div>
          </div>
        </div>
      )}

      {isItemModalOpen && (
        <div className="menu-editor__modal-overlay">
          <div className="menu-editor__modal-container">
            <div className="menu-editor__modal-header">
              <h3 className="menu-editor__modal-title">{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
              <button onClick={handleCancel} className="menu-editor__close-btn"><X size={18} /></button>
            </div>
            <div className="menu-editor__modal-body">
              <div className="menu-editor__form-group">
                <label className="menu-editor__form-label">Dish Image</label>
                {previewImage ? (
                  <div className="menu-editor__image-preview">
                    <img src={previewImage} alt="Preview" className="menu-editor__preview-img" />
                    <button onClick={removeImage} className="menu-editor__remove-img-btn"><Trash2 size={14} /></button>
                  </div>
                ) : (
                  <label className="menu-editor__upload-area">
                    <div className="menu-editor__upload-content">
                      <Upload size={24} /><div className="menu-editor__upload-text">Click to upload image</div>
                      <div className="menu-editor__upload-subtext">PNG, JPG up to 10MB</div>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="menu-editor__file-input" />
                  </label>
                )}
              </div>
              <div className="menu-editor__form-row">
                <div className="menu-editor__form-group">
                  <label className="menu-editor__form-label">Dish Name</label>
                  <input type="text" value={formData.name || ''} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="menu-editor__form-input" placeholder="Enter dish name" />
                </div>
                <div className="menu-editor__form-group">
  <label className="menu-editor__form-label">Price</label>
  <div className="menu-editor__price-input">
    <span className="menu-editor__currency">₹</span>
    <input 
      type="number" 
      step="0.01" 
      value={formData.price || ''} 
      onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))} 
      className="menu-editor__form-input menu-editor__price-field" 
      placeholder="0.00" 
    />
  </div>
</div>
              </div>
              <div className="menu-editor__form-group">
                <label className="menu-editor__form-label">Category</label>
                <div className="menu-editor__category-input-container">
                  <select value={formData.category || 'Uncategorized'} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))} className="menu-editor__form-select">
                    {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                    <option value="Uncategorized">Uncategorized</option>
                  </select>
                  <button type="button" onClick={handleAddCategoryClick} className="menu-editor__add-inline-category-btn" title="Add new category"><Plus size={16}/></button>
                </div>
              </div>
              <div className="menu-editor__form-group">
                <label className="menu-editor__form-label">Ingredients</label>
                <textarea value={formData.ingredients || ''} onChange={e => setFormData(prev => ({ ...prev, ingredients: e.target.value }))} rows={2} className="menu-editor__form-textarea" placeholder="List main ingredients..." />
              </div>
              <div className="menu-editor__form-group">
                <label className="menu-editor__form-label">Description (Optional)</label>
                <textarea value={formData.description || ''} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={2} className="menu-editor__form-textarea" placeholder="Brief description of the dish..." />
              </div>
            </div>
            <div className="menu-editor__modal-footer">
              <button onClick={handleCancel} className="menu-editor__cancel-btn">Cancel</button>
              <button onClick={handleSave} disabled={!formData.name || !formData.price} className="menu-editor__save-btn">{editingItem ? 'Update Item' : 'Add Item'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuEditor;
