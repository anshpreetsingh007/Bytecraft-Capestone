"use client";

import "./profile.css";

export default function ProfilePage() {
  return (
    <main className="profile-page">
      <h1 className="page-title">Inspector Profile</h1>

      <div className="profile-card">
        <div className="profile-avatar">I</div>
        <h2>Inspector Account</h2>
        <p><strong>Role:</strong> Inspector</p>
        <p><strong>Email:</strong> inspector@markitroofing.com</p>
        <p><strong>Department:</strong> Roofing Inspection</p>

        <button className="profile-button">Edit Profile</button>
      </div>
    </main>
  );
}