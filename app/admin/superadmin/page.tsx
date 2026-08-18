"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "../../../components/AdminPageHeader";
import { api, errorMessage, pageInfo, query, rows } from "@/lib/api";
import { useAuth } from "../../../Context/AuthContext";
import {
  Banner,
  ConfirmDialog,
  EmptyState,
  Pagination,
  SkeletonRows,
  StatusPill,
  useToast,
  type PageInfo,
} from "../../../components/ui";
import "./inspect-assign.css";

type DirectoryUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  firebaseUid: string;
  phone: string | null;
  isActive: boolean;
};

interface PendingRoleChange {
  user: DirectoryUser;
  newRole: string;
}

const ROLE_OPTIONS = [
  { value: "client", label: "Client" },
  { value: "inspector", label: "Inspector" },
  { value: "admin", label: "Admin" },
];

export default function UserManagementPage() {
  const toast = useToast();
  const { currentUser, refreshProfile } = useAuth();

  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [pagination, setPagination] = useState<PageInfo | null>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingRoleChange | null>(null);
  const [pendingDeactivation, setPendingDeactivation] = useState<DirectoryUser | null>(null);

  const fetchUsers = useCallback(async (requestedPage: number, search: string) => {
    setLoading(true);
    setError(null);
    try {
      // Searching and paging happen on the server now. This endpoint used to
      // return every account in one unbounded response.
      const payload = await api.get<DirectoryUser[]>(
        `/api/auth/users${query({ page: requestedPage, limit: 25, search: search || null })}`,
      );
      setUsers(rows(payload));
      setPagination(pageInfo(payload));
    } catch (err) {
      setError(errorMessage(err, "Could not load the user directory."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page, appliedSearch);
  }, [page, appliedSearch, fetchUsers]);

  // Debounce the search box so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(searchTerm.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  async function confirmRoleChange() {
    if (!pendingChange) return;
    const { user, newRole } = pendingChange;

    setUpdatingUid(user.firebaseUid);
    try {
      await api.patch("/api/auth/users/role", {
        firebase_uid: user.firebaseUid,
        role: newRole,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
      });

      setUsers((prev) =>
        prev.map((entry) => (entry.firebaseUid === user.firebaseUid ? { ...entry, role: newRole } : entry)),
      );

      toast.success(
        "Role updated",
        `${user.firstName} ${user.lastName} is now ${newRole.replace("_", " ")}.`,
      );
      setPendingChange(null);

      // If somehow the change touched the signed-in account, pick it up
      // rather than leaving stale permissions in the session.
      if (currentUser?.uid === user.firebaseUid) await refreshProfile();
    } catch (err) {
      toast.error("Could not update that role", errorMessage(err));
    } finally {
      setUpdatingUid(null);
    }
  }

  async function confirmDeactivation() {
    if (!pendingDeactivation) return;
    const user = pendingDeactivation;
    const nextActive = !user.isActive;

    setUpdatingUid(user.firebaseUid);
    try {
      await api.patch("/api/auth/users/status", {
        firebase_uid: user.firebaseUid,
        is_active: nextActive,
      });

      setUsers((prev) =>
        prev.map((entry) =>
          entry.firebaseUid === user.firebaseUid ? { ...entry, isActive: nextActive } : entry,
        ),
      );

      toast.success(
        nextActive ? "Account reactivated" : "Account deactivated",
        nextActive
          ? `${user.firstName} can sign in again.`
          : `${user.firstName} can no longer sign in. Their history is kept.`,
      );
      setPendingDeactivation(null);
    } catch (err) {
      toast.error("Could not update that account", errorMessage(err));
    } finally {
      setUpdatingUid(null);
    }
  }

  return (
    <main className="admin-page">
      <AdminPageHeader
        eyebrow="Super admin"
        title="User Management"
        subtitle="Assign roles, deactivate accounts, and search everyone with access to the platform."
        chips={[{ label: "Accounts", value: loading ? "—" : (pagination?.total ?? users.length) }]}
      />

      {error ? (
        <Banner
          title="Could not load the user directory"
          detail={error}
          onRetry={() => fetchUsers(page, appliedSearch)}
        />
      ) : null}

      <section className="users-section">
        <div className="section-header adm-section-head">
          <h2>All Users</h2>
          <label>
            <span className="ui-sr-only">Search users by name or email</span>
            <input
              type="search"
              placeholder="Search user by name or email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="search-input"
            />
          </label>
        </div>

        {loading ? (
          <SkeletonRows rows={5} height={48} />
        ) : users.length === 0 ? (
          <EmptyState
            title={appliedSearch ? "No matching accounts" : "No accounts yet"}
            message={
              appliedSearch
                ? `Nothing matched "${appliedSearch}". Try part of a name or an email address.`
                : "Accounts appear here as people sign up."
            }
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = currentUser?.uid === user.firebaseUid;
                const isBusy = updatingUid === user.firebaseUid;
                const locked = user.role === "super_admin" || isSelf;

                return (
                  <tr key={user.firebaseUid}>
                    <td>
                      {user.firstName} {user.lastName}
                      {isSelf ? <span className="self-tag"> (you)</span> : null}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span style={{ textTransform: "capitalize" }}>{user.role.replace("_", " ")}</span>
                    </td>
                    <td>
                      <StatusPill
                        status={user.isActive ? "active" : "deactivated"}
                        tone={user.isActive ? "success" : "neutral"}
                      />
                    </td>
                    <td>
                      {locked ? (
                        // Changing your own role, or a super admin's, is
                        // refused by the server too -- this is just so the
                        // control is not offered in the first place.
                        <span className="no-actions">
                          {isSelf ? "You cannot change your own access" : "No actions available"}
                        </span>
                      ) : (
                        <div className="user-actions">
                          <label>
                            <span className="ui-sr-only">Role for {user.firstName} {user.lastName}</span>
                            <select
                              value={user.role}
                              disabled={isBusy}
                              onChange={(event) =>
                                setPendingChange({ user, newRole: event.target.value })
                              }
                            >
                              {ROLE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            type="button"
                            className="ui-button ui-button--secondary"
                            disabled={isBusy}
                            onClick={() => setPendingDeactivation(user)}
                          >
                            {user.isActive ? "Deactivate" : "Reactivate"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {pagination && !loading ? (
          <Pagination info={pagination} onPageChange={setPage} label="accounts" busy={loading} />
        ) : null}
      </section>

      <ConfirmDialog
        open={pendingChange !== null}
        onCancel={() => setPendingChange(null)}
        onConfirm={confirmRoleChange}
        busy={updatingUid !== null}
        title="Change this person's role?"
        description={
          pendingChange
            ? `${pendingChange.user.firstName} ${pendingChange.user.lastName} goes from ${pendingChange.user.role.replace(
                "_",
                " ",
              )} to ${pendingChange.newRole.replace("_", " ")}. Their past work stays attached to them, and the change is recorded in the audit log.`
            : undefined
        }
        confirmLabel="Change role"
      />

      <ConfirmDialog
        open={pendingDeactivation !== null}
        onCancel={() => setPendingDeactivation(null)}
        onConfirm={confirmDeactivation}
        busy={updatingUid !== null}
        destructive={pendingDeactivation?.isActive ?? false}
        title={pendingDeactivation?.isActive ? "Deactivate this account?" : "Reactivate this account?"}
        description={
          pendingDeactivation?.isActive
            ? `${pendingDeactivation.firstName} will be signed out and blocked from signing in again. Nothing is deleted, so their inspections, estimates and reports stay intact.`
            : `${pendingDeactivation?.firstName} will be able to sign in again with their previous role.`
        }
        confirmLabel={pendingDeactivation?.isActive ? "Deactivate" : "Reactivate"}
      />
    </main>
  );
}
