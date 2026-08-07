"use client";
import { useState, useMemo, useEffect } from "react";
import { InventoryItem, getStockStatus } from "../types/inventory";
import "./inventory.css";

const emptyForm = {
  name: "",
  category: "",
  quantity: "",
  unit: "",
  reorderThreshold: "",
  cost: "",
  coverageSqft: "",
};

const statusClassMap: Record<string, string> = {
  "In Stock": "status-in-stock",
  "Low Stock": "status-low",
  "Out of Stock": "status-out",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    }
  }

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
      cost: item.unitCost != null ? String(item.unitCost) : "",
      coverageSqft: item.coverageSqft != null ? String(item.coverageSqft) : "1",
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.category.trim() || !form.unit.trim()) {
      return;
    }

    const quantityNum = parseInt(form.quantity, 10) || 0;
    const thresholdNum = parseInt(form.reorderThreshold, 10) || 0;
    const costNum = parseFloat(form.cost) || 0;
    const coverageNum = parseFloat(form.coverageSqft) || 1.0;

    const payload = {
      name: form.name,
      category: form.category,
      quantity: quantityNum,
      unit: form.unit,
      reorderThreshold: thresholdNum,
      unitCost: costNum,
      coverageSqft: coverageNum,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/inventory/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        }
      } else {
        const res = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const newItem = await res.json();
          setItems((prev) => [newItem, ...prev]);
        }
      }
    } catch (err) {
      console.error("Failed to save item:", err);
    }

    closeForm();
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
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
            <div className="form-field">
              <label htmlFor="cost">Cost per Unit ($)</label>
              <input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="form-field">
              <label htmlFor="coverageSqft">Coverage per Unit (sqft)</label>
              <input
                id="coverageSqft"
                type="number"
                min="0.1"
                step="0.1"
                value={form.coverageSqft}
                onChange={(e) => setForm({ ...form, coverageSqft: e.target.value })}
                placeholder="e.g. 33.3"
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
          <span>Cost</span>
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
                <span className="item-cost">
                  {item.unitCost != null ? formatCurrency(Number(item.unitCost)) : "—"}
                </span>
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

