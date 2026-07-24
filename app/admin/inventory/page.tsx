"use client";
import { useState, useMemo } from "react";
import { mockInventory } from "../mockdata/mockInventory";
import { InventoryItem, getStockStatus } from "../types/inventory";
import "./inventory.css";

const emptyForm = {
  name: "",
  category: "",
  quantity: "",
  unit: "",
  reorderThreshold: "",
};

const statusClassMap: Record<string, string> = {
  "In Stock": "status-in-stock",
  "Low Stock": "status-low",
  "Out of Stock": "status-out",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(mockInventory);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [items, search]);

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEditForm(item: InventoryItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      reorderThreshold: String(item.reorderThreshold),
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleSave() {
    if (!form.name.trim() || !form.category.trim() || !form.unit.trim()) {
      return;
    }

    const quantityNum = parseInt(form.quantity, 10) || 0;
    const thresholdNum = parseInt(form.reorderThreshold, 10) || 0;

    if (editingId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name: form.name,
                category: form.category,
                quantity: quantityNum,
                unit: form.unit,
                reorderThreshold: thresholdNum,
              }
            : item
        )
      );
    } else {
      const newItem: InventoryItem = {
        id: "inv-" + Date.now(),
        name: form.name,
        category: form.category,
        quantity: quantityNum,
        unit: form.unit,
        reorderThreshold: thresholdNum,
      };
      setItems((prev) => [newItem, ...prev]);
    }

    closeForm();
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">{items.length} items tracked</p>
        </div>
        <button className="btn-primary" onClick={openAddForm} type="button">
          + Add Item
        </button>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="Search by name or category..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {formOpen && (
        <div className="item-form-card">
          <h2 className="section-title">{editingId ? "Edit Item" : "Add New Item"}</h2>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="name">Item Name</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Asphalt Shingles"
              />
            </div>
            <div className="form-field">
              <label htmlFor="category">Category</label>
              <input
                id="category"
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Roofing Material"
              />
            </div>
            <div className="form-field">
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="form-field">
              <label htmlFor="unit">Unit</label>
              <input
                id="unit"
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="e.g. bundles"
              />
            </div>
            <div className="form-field">
              <label htmlFor="reorderThreshold">Reorder Threshold</label>
              <input
                id="reorderThreshold"
                type="number"
                min="0"
                value={form.reorderThreshold}
                onChange={(e) => setForm({ ...form, reorderThreshold: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={closeForm} type="button">
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave} type="button">
              {editingId ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </div>
      )}

      <div className="inventory-table">
        <div className="table-header-row">
          <span>Item</span>
          <span>Category</span>
          <span>Quantity</span>
          <span>Status</span>
          <span></span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="empty-state">No items match your search.</div>
        ) : (
          filteredItems.map((item) => {
            const status = getStockStatus(item);
            return (
              <div className="table-row" key={item.id}>
                <span className="item-name">{item.name}</span>
                <span className="item-category">{item.category}</span>
                <span className="item-quantity">
                  {item.quantity} {item.unit}
                </span>
                <span className={`status-badge ${statusClassMap[status]}`}>{status}</span>
                <span className="row-actions">
                  <button className="link-btn" onClick={() => openEditForm(item)} type="button">
                    Edit
                  </button>
                  <button
                    className="link-btn link-btn-danger"
                    onClick={() => handleDelete(item.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}