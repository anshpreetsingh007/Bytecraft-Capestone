"use client";

import { useState, useEffect } from "react";
import { AdminPageHeader } from "../../../components/AdminPageHeader";
import "./inspect-assign.css";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  firebaseUid: string;
};

export default function InspectorAssignmentPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/auth/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const changeRole = async (user: User, newRole: string) => {
    // Basic confirmation
    if (!window.confirm(`Change ${user.firstName}'s role from ${user.role} to ${newRole}?`)) {
      return;
    }

    setUpdatingId(user.firebaseUid);
    try {
      const res = await fetch("/api/auth/users/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid: user.firebaseUid,
          role: newRole,
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update role");
      }

      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, role: newRole } : u
        )
      );
      alert(`Successfully updated role to ${newRole}`);
    } catch (err: any) {
      alert(`Error updating role: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <main className="admin-page">
      <AdminPageHeader
        eyebrow="Super admin"
        title="User Management"
        subtitle="Manage users, assign roles, and search system accounts."
        chips={[{ label: "Accounts", value: loading ? "\u2014" : users.length }]}
      />

      {error && <div style={{ color: "red", marginBottom: "1rem" }}>Error: {error}</div>}

      <section className="users-section">
        <div className="section-header adm-section-head">
          <h2>All Users</h2>
          <input
            type="text"
            placeholder="Search user by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.firebaseUid}>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.email}</td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {user.role === 'super_admin' ? (
                        <span style={{ color: "var(--color-muted)", fontSize: "13px", fontStyle: "italic" }}>
                          No actions available
                        </span>
                      ) : (
                        <>
                          <select
                            value={user.role}
                            disabled={updatingId === user.firebaseUid}
                            onChange={(e) => changeRole(user, e.target.value)}
                          >
                            <option value="client">Client</option>
                            <option value="inspector">Inspector</option>
                            <option value="admin">Admin</option>
                          </select>
                          {updatingId === user.firebaseUid && <span style={{ marginLeft: "10px", fontSize: "0.8rem" }}>Updating...</span>}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    No users found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}