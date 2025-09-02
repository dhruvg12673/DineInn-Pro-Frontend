import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, MapPin, Edit3, X } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import './TableManagementPage.css';
import {  ArrowLeft } from 'lucide-react';
const API_BASE = 'https://dineinn-pro-backend.onrender.com'; // Adjust if your backend URL differs

const TableManagementPage = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true); // State to handle initial loading
  const [error, setError] = useState(null); // State to handle fetch errors

  const [modals, setModals] = useState({
    addCategory: false,
    editCategory: false,
    deleteCategory: false,
    editTables: false,
    categoryManager: false,
    tableManager: false,
    deleteTable: false,
  });

  const [modalData, setModalData] = useState({
    categoryId: null,
    categoryName: '',
    newCategoryName: '',
    selectedTableId: null,
    selectedCategoryId: null,
    selectedTableIndex: null,
    tableName: '',
  });

  const openModal = (modalType, data = {}) => {
    setModals((prev) => ({ ...prev, [modalType]: true }));
    setModalData((prev) => ({ ...prev, ...data }));
  };

  const closeModal = (modalType) => {
    setModals((prev) => ({ ...prev, [modalType]: false }));
    setModalData({
      categoryId: null,
      categoryName: '',
      newCategoryName: '',
      selectedTableId: null,
      selectedCategoryId: null,
      selectedTableIndex: null,
      tableName: '',
    });
  };

  // This function now fetches data and handles errors gracefully
  const fetchData = async () => {
    // --- FIX: Validate that restaurantId is a number before making an API call ---
    const parsedId = parseInt(restaurantId, 10);
    if (isNaN(parsedId)) {
      setError(`Invalid Restaurant ID ("${restaurantId}") in URL. Cannot fetch data.`);
      setLoading(false);
      return; // Stop execution if the ID is not a valid number
    }

    try {
      const catRes = await axios.get(`${API_BASE}/api/categories`, { params: { restaurantId } });
      const tableRes = await axios.get(`${API_BASE}/api/tables`, { params: { restaurantId } });
      
      const categoriesData = catRes.data;
      const tablesData = tableRes.data;

      const grouped = categoriesData.map((category) => ({
        ...category,
        tables: tablesData
          .filter((table) => table.categoryid === category.id)
          .map((table) => ({ id: table.id, name: table.tablenumber, status: table.status })),
      }));

      const uncategorizedTables = tablesData
        .filter((table) => !table.categoryid)
        .map((table) => ({ id: table.id, name: table.tablenumber, status: table.status }));

      if (uncategorizedTables.length > 0) {
        grouped.push({
          id: 'uncategorized',
          name: 'Uncategorized',
          tables: uncategorizedTables,
        });
      }

      setCategories(grouped);
      setError(null); // Clear any previous errors on a successful fetch
    } catch (error) {
      console.error('Failed to fetch data:', error);
      if (categories.length === 0) {
        setError('Could not connect to the server. Retrying automatically...');
      }
    } finally {
      setLoading(false);
    }
  };

  // This useEffect is now more robust for handling the race condition
  useEffect(() => {
    fetchData(); // Initial fetch

    const interval = setInterval(() => {
        fetchData(); // Subsequent polling
    }, 15000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [restaurantId]);


  // All your handler functions for modals remain unchanged
  const addCategory = async () => {
    if (!modalData.newCategoryName.trim()) return;
    try {
      await axios.post(`${API_BASE}/api/categories`, {
        restaurantId,
        name: modalData.newCategoryName.trim(),
      });
      await fetchData();
      closeModal('addCategory');
    } catch (error) {
      console.error('Failed to add category:', error);
      alert(error.response?.data?.error || 'Failed to add category');
    }
  };

  const updateCategoryName = async () => {
    if (!modalData.categoryName.trim() || !modalData.categoryId) return;
    try {
      await axios.put(`${API_BASE}/api/categories/${modalData.categoryId}`, {
        name: modalData.categoryName.trim(),
      });
      await fetchData();
      closeModal('editCategory');
    } catch (error) {
      console.error('Failed to update category:', error);
      alert(error.response?.data?.error || 'Failed to update category');
    }
  };

  const deleteCategory = async () => {
    if (!modalData.categoryId) return;
    try {
      await axios.delete(`${API_BASE}/api/categories/${modalData.categoryId}`);
      await fetchData();
      closeModal('deleteCategory');
    } catch (error)      {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  const addTable = async (categoryId) => {
    if (!categoryId) return;
    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return;
    const newTableNumber = category.tables.length + 1;
    const newTableName = `Table ${newTableNumber}`;
    try {
      await axios.post(`${API_BASE}/api/tables`, {
        restaurantId,
        tableNumber: newTableName,
        categoryId,
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to add table:', error);
      alert('Failed to add table');
    }
  };

  const updateTableName = async () => {
    if (!modalData.tableName.trim() || !modalData.selectedTableId) return;
    try {
      await axios.put(`${API_BASE}/api/tables/${modalData.selectedTableId}`, {
        tableNumber: modalData.tableName.trim(),
        categoryId: modalData.selectedCategoryId,
      });
      await fetchData();
      closeModal('editTables');
    } catch (error) {
      console.error('Failed to update table:', error);
      alert('Failed to update table');
    }
  };

  const deleteTable = async () => {
    if (!modalData.selectedTableId) return;
    try {
      await axios.delete(`${API_BASE}/api/tables/${modalData.selectedTableId}`);
      await fetchData();
      closeModal('deleteTable');
    } catch (error) {
      console.error('Failed to delete table:', error);
      alert('Failed to delete table');
    }
  };

  // In TableManager.jsx

// In TableManager.jsx

const handleTableClick = (table, tableCategoryId) => {
  // Navigate to billing for any table, passing both table name and its category ID
  // We use a specific name 'tableCategoryId' to avoid confusion
  navigate(
    `/admin/billing?tableNumber=${encodeURIComponent(table.name)}&tableCategoryId=${encodeURIComponent(tableCategoryId)}`
  );
};

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
      <div
        className="modal-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="modal-container">
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            <button
              onClick={onClose}
              className="modal-close-btn"
              aria-label="Close modal"
              type="button"
            >
              <X className="modal-close-icon" />
            </button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="table-header">
        <div className="header-content">
          <div className="header-left">
            <div>
              <h1 className="page-title">Table Management</h1>
              <p className="page-subtitle"></p>
            </div>
            <div className="header-stats">
              <div className="stats-info">
                <MapPin className="stats-icon" />
                <span>Total Categories: {categories.length}</span>
                <span>•</span>
                <span>
                  Total Tables: {categories.reduce((sum, cat) => sum + cat.tables.length, 0)}
                </span>
              </div>
              <button
                onClick={() => openModal('categoryManager')}
                className="edit-category-header-btn"
                type="button"
              >
                <Edit3 className="btn-icon" />
                Edit Categories
              </button>
              <button
                onClick={() => openModal('tableManager')}
                className="edit-table-header-btn"
                type="button"
              >
                <Edit3 className="btn-icon" />
                Edit Tables
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* --- UPDATED: More robust conditional rendering logic --- */}
        {loading ? (
          <div className="empty-state">
            <p>Loading tables...</p>
          </div>
        ) : error ? (
            <div className="empty-state">
                <p>{error}</p>
            </div>
        ) : categories.length > 0 ? (
          <div className="categories-grid">
            {categories.map((category) => (
              <div key={category.id} className="category-card">
                <div className="category-header">
                  <div className="category-info">
                    <div>
                      <h3 className="category-name">{category.name}</h3>
                      <p className="category-count">{category.tables.length} tables</p>
                    </div>
                  </div>
                </div>
                <div className="tables-container">
                  <div className="tables-grid">
                    {category.tables.map((table) => (
                      <button
                        key={table.id}
                        onClick={() => handleTableClick(table, category.id)}
                        className={`table-btn ${table.status === 'occupied' ? 'occupied' : ''}`}
                        type="button"
                      >
                        {table.status === 'occupied' ? (
                          <>
                            <div className="table-name">{table.name}</div>
                            <div className="table-subtitle occupied-text">Occupied</div>
                          </>
                        ) : (
                          <>
                            <div className="table-name">{table.name}</div>
                            <div className="table-subtitle">Available</div>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon-container">
              <MapPin className="empty-icon" />
            </div>
            <h3 className="empty-title">No categories yet</h3>
            <p className="empty-subtitle">Start by adding your first table category</p>
            <button
              onClick={() => openModal('categoryManager')}
              className="empty-add-btn"
              type="button"
            >
              <Plus className="btn-icon" />
              Add Category
            </button>
          </div>
        )}
      </div>

      {/* All your modals remain unchanged */}
      <Modal
        isOpen={modals.categoryManager}
        onClose={() => closeModal('categoryManager')}
        title="Manage Categories"
      >
        <div className="modal-form">
          <div className="manager-section">
            <h4 className="manager-section-title">Existing Categories</h4>
            <div className="manager-list">
              {categories.map((category) => (
                <div key={category.id} className="manager-item">
                  <div className="manager-item-info">
                    <span className="manager-item-name">{category.name}</span>
                    <span className="manager-item-count">{category.tables.length} tables</span>
                  </div>
                  <div className="manager-item-actions">
                    <button
                      onClick={() =>
                        openModal('editCategory', {
                          categoryId: category.id,
                          categoryName: category.name,
                        })
                      }
                      className="manager-action-btn edit-btn"
                      title="Edit category"
                      type="button"
                    >
                      <Edit3 className="action-icon" />
                    </button>
                    <button
                      onClick={() =>
                        openModal('deleteCategory', {
                          categoryId: category.id,
                          categoryName: category.name,
                        })
                      }
                      className="manager-action-btn delete-btn"
                      title="Delete category"
                      type="button"
                    >
                      <Trash2 className="action-icon" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="add-section">
            <button
              onClick={() => openModal('addCategory', { newCategoryName: '' })}
              className="add-manager-btn"
              type="button"
            >
              <Plus className="add-icon" />
              <span>Add New Category</span>
            </button>
          </div>
          <div className="modal-actions single-action">
            <button
              onClick={() => closeModal('categoryManager')}
              className="primary-btn done-btn"
              type="button"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modals.tableManager}
        onClose={() => closeModal('tableManager')}
        title="Manage Tables"
      >
        <div className="modal-form">
          <div className="manager-section">
            <h4 className="manager-section-title">All Tables</h4>
            <div className="manager-list">
              {categories.map((category) => (
                <div key={category.id} className="category-section">
                  <h5 className="category-section-title">{category.name}</h5>
                  {category.tables.map((table) => (
                    <div key={table.id} className="manager-item">
                      <div className="manager-item-info">
                        <span className="manager-item-name">{table.name}</span>
                      </div>
                      <div className="manager-item-actions">
                        <button
                          onClick={() =>
                            openModal('editTables', {
                              selectedTableId: table.id,
                              selectedCategoryId: category.id,
                              tableName: table.name,
                            })
                          }
                          className="manager-action-btn edit-btn"
                          title="Edit table"
                          type="button"
                        >
                          <Edit3 className="action-icon" />
                        </button>
                        <button
                          onClick={() =>
                            openModal('deleteTable', {
                              selectedTableId: table.id,
                              selectedCategoryId: category.id,
                              tableName: table.name,
                            })
                          }
                          className="manager-action-btn delete-btn"
                          title="Delete table"
                          type="button"
                        >
                          <Trash2 className="action-icon" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addTable(category.id)}
                    className="add-table-to-category-btn"
                    title={`Add Table to ${category.name}`}
                    type="button"
                  >
                    <Plus className="add-icon" />
                    <span>Add Table to {category.name}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-actions single-action">
            <button
              onClick={() => closeModal('tableManager')}
              className="primary-btn done-btn"
              type="button"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
      
      <Modal isOpen={modals.addCategory} onClose={() => closeModal('addCategory')} title="Add New Category">
        <div className="modal-form">
          <div>
            <label className="form-label">Category Name</label>
            <input
              type="text"
              placeholder="e.g., Ground Floor, Patio, VIP Section"
              value={modalData.newCategoryName}
              onChange={(e) => setModalData((prev) => ({ ...prev, newCategoryName: e.target.value }))}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCategory();
                }
              }}
              className="form-input"
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button onClick={() => closeModal('addCategory')} className="cancel-btn" type="button">
              Cancel
            </button>
            <button
              onClick={addCategory}
              disabled={!modalData.newCategoryName.trim()}
              className="primary-btn add-btn"
              type="button"
            >
              Add Category
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modals.editCategory} onClose={() => closeModal('editCategory')} title="Edit Category">
        <div className="modal-form">
          <div>
            <label className="form-label">Category Name</label>
            <input
              type="text"
              value={modalData.categoryName}
              onChange={(e) => setModalData((prev) => ({ ...prev, categoryName: e.target.value }))}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  updateCategoryName();
                }
              }}
              className="form-input edit-input"
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button onClick={() => closeModal('editCategory')} className="cancel-btn" type="button">
              Cancel
            </button>
            <button
              onClick={updateCategoryName}
              disabled={!modalData.categoryName.trim()}
              className="primary-btn update-btn"
              type="button"
            >
              Update
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modals.deleteCategory} onClose={() => closeModal('deleteCategory')} title="Delete Category">
        <div className="modal-form">
          <div className="delete-confirmation">
            <div className="delete-icon-container">
              <Trash2 className="delete-icon" />
            </div>
            <h4 className="delete-title">Are you sure?</h4>
            <p className="delete-message">
              This will permanently delete the category "{modalData.categoryName}" and all its tables. This action cannot be undone.
            </p>
          </div>
          <div className="modal-actions">
            <button onClick={() => closeModal('deleteCategory')} className="cancel-btn" type="button">
              Cancel
            </button>
            <button onClick={deleteCategory} className="primary-btn delete-confirm-btn" type="button">
              Delete Category
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modals.editTables} onClose={() => closeModal('editTables')} title="Edit Table">
        <div className="modal-form">
          <div>
            <label className="form-label">Table Name</label>
            <input
              type="text"
              value={modalData.tableName}
              onChange={(e) => setModalData((prev) => ({ ...prev, tableName: e.target.value }))}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  updateTableName();
                }
              }}
              className="form-input"
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button onClick={() => closeModal('editTables')} className="cancel-btn" type="button">
              Cancel
            </button>
            <button
              onClick={updateTableName}
              disabled={!modalData.tableName.trim()}
              className="primary-btn update-btn"
              type="button"
            >
              Update
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modals.deleteTable} onClose={() => closeModal('deleteTable')} title="Delete Table">
        <div className="modal-form">
          <div className="delete-confirmation">
            <div className="delete-icon-container">
              <Trash2 className="delete-icon" />
            </div>
            <h4 className="delete-title">Are you sure?</h4>
            <p className="delete-message">
              This will permanently delete the table "{modalData.tableName}". This action cannot be undone.
            </p>
          </div>
          <div className="modal-actions">
            <button onClick={() => closeModal('deleteTable')} className="cancel-btn" type="button">
              Cancel
            </button>
            <button onClick={deleteTable} className="primary-btn delete-confirm-btn" type="button">
              Delete Table
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TableManagementPage;
