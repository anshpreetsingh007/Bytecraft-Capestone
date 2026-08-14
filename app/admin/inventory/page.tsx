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

// Pre-set categories, plus an "add new" escape hatch for anything not listed.
const PRESET_CATEGORIES = [
  "Shingle",
  "Metal",
  "Tile",
  "Membrane / Flat Roofing",
  "Fasteners",
  "1 1/4 Nail",
  "Flashing",
  "Underlayment",
  "Gutters",
  "Safety Equipment",
  "Tools",
  "Office Supplies",
  "Other",
];
const ADD_NEW_CATEGORY_VALUE = "__add_new__";

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// --- Input filters, applied as the admin types so invalid characters never
// make it into the field in the first place 

// Whole numbers only — Quantity, Reorder Threshold.
function filterDigitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

// Numbers with an optional single decimal point — Cost per Unit, Coverage.
function filterDecimal(value: string): string {
  let cleaned = value.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  return cleaned;
}

// Item name — letters, numbers, spaces, and the handful of characters that
// show up in real roofing item names (e.g. 1 1/4" Nail, Ridge-Cap).
// Blocks everything else (no <, >, quotes, etc.)
function filterItemName(value: string): string {
  return value.replace(/[^a-zA-Z0-9\s\-'"/.]/g, "");
}

// New category name — letters, numbers, and spaces only. No punctuation.
function filterCategoryName(value: string): string {
  return value.replace(/[^a-zA-Z0-9\s]/g, "");
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Category dropdown state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

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

  const allCategories = useMemo(
    () => [...PRESET_CATEGORIES.slice(0, -1), ...customCategories, "Other"],
    [customCategories]
  );

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
    setIsAddingCategory(false);
    setFormOpen(true);
  }

  function openEditForm(item: InventoryItem) {
    setEditingId(item.id);
    const knownCategory = allCategories.includes(item.category);
    setForm({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      reorderThreshold: String(item.reorderThreshold),
      cost: item.unitCost != null ? String(item.unitCost) : "",
      coverageSqft: item.coverageSqft != null ? String(item.coverageSqft) : "1",
    });
    // If this item's category isn't in our list (e.g. legacy data), treat it
    // as a custom category so the dropdown doesn't silently blank it out.
    if (!knownCategory && item.category) {
      setCustomCategories((prev) => (prev.includes(item.category) ? prev : [...prev, item.category]));
    }
    setIsAddingCategory(false);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setIsAddingCategory(false);
  }

  function handleCategorySelect(value: string) {
    if (value === ADD_NEW_CATEGORY_VALUE) {
      setIsAddingCategory(true);
      setForm({ ...form, category: "" });
    } else {
      setIsAddingCategory(false);
      setForm({ ...form, category: value });
    }
  }

  function handleNewCategoryInput(value: string) {
    setForm({ ...form, category: filterCategoryName(value) });
  }

  function requestSave() {
    if (!form.name.trim() || !form.category.trim() || !form.unit.trim()) {
      return;
    }
    // Editing an existing item silently overwrites its data — worth a beat
    // of confirmation. Adding a brand-new item doesn't carry that risk.
    if (editingId) {
      setShowSaveConfirm(true);
    } else {
      performSave();
    }
  }

  async function performSave() {
    setShowSaveConfirm(false);

    // If the admin was mid-way through typing a new category name, remember
    // it for next time so it shows up in the dropdown going forward.
    if (isAddingCategory && form.category.trim()) {
      setCustomCategories((prev) =>
        prev.includes(form.category.trim()) ? prev : [...prev, form.category.trim()]
      );
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

  function requestDelete(item: InventoryItem) {
    setDeleteTarget(item);
    setDeleteConfirmText("");
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
    setDeleteTarget(null);
    setDeleteConfirmText("");
  }

  const deleteConfirmed = deleteConfirmText.trim().toLowerCase() === "delete";

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
                onChange={(e) => setForm({ ...form, name: filterItemName(e.target.value) })}
                placeholder="e.g. Asphalt Shingles"
              />
            </div>

            <div className="form-field">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={isAddingCategory ? ADD_NEW_CATEGORY_VALUE : form.category}
                onChange={(e) => handleCategorySelect(e.target.value)}
              >
                <option value="" disabled>
                  Select a category
                </option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value={ADD_NEW_CATEGORY_VALUE}>+ Add new category...</option>
              </select>
              {isAddingCategory && (
                <input
                  className="new-category-input"
                  type="text"
                  value={form.category}
                  onChange={(e) => handleNewCategoryInput(e.target.value)}
                  placeholder="New category name"
                  autoFocus
                />
              )}
              <span className="field-hint">Letters and numbers only.</span>
            </div>

            <div className="form-field">
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                type="text"
                inputMode="numeric"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: filterDigitsOnly(e.target.value) })}
                placeholder="0"
              />
            </div>

            <div className="form-field">
              <label htmlFor="unit">Unit</label>
              <input
                id="unit"
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: filterItemName(e.target.value) })}
                placeholder="e.g. bundles"
              />
            </div>

            <div className="form-field">
              <label htmlFor="reorderThreshold">Reorder Threshold</label>
              <input
                id="reorderThreshold"
                type="text"
                inputMode="numeric"
                value={form.reorderThreshold}
                onChange={(e) =>
                  setForm({ ...form, reorderThreshold: filterDigitsOnly(e.target.value) })
                }
                placeholder="0"
              />
            </div>

            <div className="form-field">
              <label htmlFor="cost">Cost per Unit ($)</label>
              <input
                id="cost"
                type="text"
                inputMode="decimal"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: filterDecimal(e.target.value) })}
                placeholder="0.00"
              />
            </div>

            <div className="form-field">
              <label htmlFor="coverageSqft">Coverage per Unit (sqft)</label>
              <input
                id="coverageSqft"
                type="text"
                inputMode="decimal"
                value={form.coverageSqft}
                onChange={(e) => setForm({ ...form, coverageSqft: filterDecimal(e.target.value) })}
                placeholder="e.g. 33.3"
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={closeForm} type="button">
              Cancel
            </button>
            <button className="btn-primary" onClick={requestSave} type="button">
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
                    onClick={() => requestDelete(item)}
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

      {/* --- Save (edit) confirmation --- */}
      {showSaveConfirm && (
        <div className="modal-overlay" onClick={() => setShowSaveConfirm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Save changes?</h3>
            <p className="modal-body">
              This will update <strong>{form.name || "this item"}</strong> with the values you entered.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowSaveConfirm(false)} type="button">
                Cancel
              </button>
              <button className="btn-primary" onClick={performSave} type="button">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Delete confirmation (type-to-confirm, since it's irreversible) --- */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title modal-title-danger">Delete this item?</h3>
            <p className="modal-body">
              <strong>{deleteTarget.name}</strong> will be permanently removed. This cannot be undone.
            </p>
            <label className="modal-confirm-label" htmlFor="delete-confirm-input">
              Type <strong>delete</strong> to confirm.
            </label>
            <input
              id="delete-confirm-input"
              className="modal-confirm-input"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete"
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)} type="button">
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={confirmDelete}
                disabled={!deleteConfirmed}
                type="button"
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
