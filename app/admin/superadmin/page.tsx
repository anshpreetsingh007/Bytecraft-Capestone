"use client";

import { useState } from "react";
import "./inspect-assign.css";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function InspectorAssignmentPage() {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "Trevor Phillips",
      email: "trevor@email.com",
      role: "Customer",
    },
    {
      id: 2,
      name: "Franklin Clinton",
      email: "franklin@email.com",
      role: "Inspector",
    },
    {
      id: 3,
      name: "John Lee",
      email: "john@email.com",
      role: "Admin",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const changeRole = (id: number, role: string) => {
    setUsers(
      users.map((user) =>
        user.id === id ? { ...user, role: role } : user
      )
    );
  };

  const deleteUser = (id: number) => {
    setUsers(users.filter((user) => user.id !== id));
  };

  // Filter users based on search input
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="admin-page">
      <h1>Inspector Assignment</h1>
      <p>Manage users, assign roles, and search system accounts.</p>

      {/* User Table Section with Search */}
      <section className="users-section">
        <div className="section-header">
          <h2>User Management</h2>
          <input
            type="text"
            placeholder="Search user by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

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
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        changeRole(user.id, e.target.value)
                      }
                    >
                      <option>Customer</option>
                      <option>Inspector</option>
                      <option>Admin</option>
                    </select>

                    <button onClick={() => deleteUser(user.id)}>
                      Delete
                    </button>
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
      </section>

    </main>
  );
}