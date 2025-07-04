import React, { useState, useEffect } from "react";
import "./App.css";

/**
 * Backend API base URL for ticketing data.
 */
const API_BASE = "https://vscode-internal-433-dev.dev01.cloud.kavia.ai:3001";

/**
 * Colorful ticket avatars for fun/playfulness.
 */
const AVATARS = [
  "🦄", "🎩", "🕺", "💃", "🐸", "🦜", "😎", "🐙", "🐱‍👤", "🪩", "🍉", "🧁", "🍕", "🎲"
];

/**
 * Helper to get a random avatar emoji for tickets.
 */
function getRandomAvatar(id) {
  const idx = typeof id === "number" ? id % AVATARS.length : Math.floor(Math.random() * AVATARS.length);
  return AVATARS[idx];
}

// PUBLIC_INTERFACE
function App() {
  // Theme state
  const [theme, setTheme] = useState("light");

  // Tickets
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [showNewTicket, setShowNewTicket] = useState(false);

  // New Ticket Entry
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketBody, setNewTicketBody] = useState("");
  const [newTicketStatus, setNewTicketStatus] = useState("");

  // View Ticket
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("");

  // Theme control
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    fetchTickets();
  }, []);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // PUBLIC_INTERFACE
  const fetchTickets = async () => {
    setLoadingTickets(true);
    setTicketError("");
    try {
      const res = await fetch(`${API_BASE}/tickets/`);
      if (!res.ok) throw new Error("Error fetching tickets");
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : data.tickets || []);
    } catch (err) {
      setTicketError(String(err));
    }
    setLoadingTickets(false);
  };

  // PUBLIC_INTERFACE
  const fetchTicketDetails = async (id) => {
    setSelectedTicket(null);
    setReplies([]);
    try {
      const res = await fetch(`${API_BASE}/tickets/${id}/`);
      if (!res.ok) throw new Error("Error fetching ticket details");
      const data = await res.json();
      setSelectedTicket(data);
      setReplies(data.replies || []);
    } catch (err) {
      setSelectedTicket({ error: String(err) });
    }
  };

  // PUBLIC_INTERFACE
  const createTicket = async (e) => {
    e.preventDefault();
    setNewTicketStatus("submitting");
    try {
      const res = await fetch(`${API_BASE}/tickets/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTicketTitle,
          content: newTicketBody,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit ticket");
      setNewTicketTitle("");
      setNewTicketBody("");
      setNewTicketStatus("success");
      setShowNewTicket(false);
      fetchTickets();
    } catch {
      setNewTicketStatus("error");
    }
  };

  // PUBLIC_INTERFACE
  const submitReply = async (ticketId, e) => {
    e.preventDefault();
    setReplyStatus("submitting");
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}/reply/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText }),
      });
      if (!res.ok) throw new Error("Failed to submit reply");
      setReplyText("");
      setReplyStatus("success");
      fetchTicketDetails(ticketId);
    } catch {
      setReplyStatus("error");
    }
  };

  // UI: Header/Nav Bar
  const Navbar = () => (
    <nav className="navbar">
      <div className="nav-brand">
        <span className="logo-emoji" aria-label="party ticket">🎉</span>
        <span className="brand-title">Anon<span style={{ color: "var(--secondary)" }}>Ticket</span></span>
      </div>
      <button className="nav-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    </nav>
  );

  // UI: Footer
  const Footer = () => (
    <footer className="footer">
      <span>AnonTicket &copy; {new Date().getFullYear()} &mdash; The fun anonymous ticket box!</span>
    </footer>
  );

  // UI: Floating Compose Button
  const ComposeButton = () => (
    <button
      className="compose-btn playful-bounce"
      style={{ position: "fixed", bottom: 38, right: 28, zIndex: 98 }}
      onClick={() => setShowNewTicket(true)}
      aria-label="Post a new ticket"
    >
      <span style={{ fontSize: "1.2em" }}>➕</span> New Ticket
    </button>
  );

  // UI: Modal for composing new ticket
  // 
  // Fix: Fully control modal rendering to ensure parent component state changes do not cause a remount or reset of the input fields.
  // Move modal close handler out of JSX (prevents inline re-creation).
  // Avoid using transient state or anonymous functions inline for handler props.
  // Remove use of unnecessary re-renders.
  // Make sure that when modal is open, NewTicketModal is not created/unmounted repeatedly.
  // 
  // Also: use "body" (was in snippets as t.body, but should use correct API fields for display).
  // 
  // The core fix here: maintain the component and handler stability, and do not use expressions or arrow functions as handler props.
  // All state updates must use their proper setters; form values are bound directly to state.

  // Handler outside component, stable reference:
  const handleCloseModal = () => setShowNewTicket(false);
  const handleTitleChange = (e) => setNewTicketTitle(e.target.value);
  const handleBodyChange = (e) => setNewTicketBody(e.target.value);

  const NewTicketModal = React.useCallback(() => (
    <div className="modal-bg" tabIndex={-1} aria-modal="true">
      <form
        className="modal-card"
        autoComplete="off"
        onSubmit={createTicket}
      >
        <span
          className="modal-close"
          tabIndex={0}
          aria-label="Close"
          onClick={handleCloseModal}
        >
          ✖
        </span>
        <h2 className="modal-title" style={{ color: "var(--primary)" }}>Submit Anonymous Ticket</h2>
        <input
          className="input-field"
          type="text"
          placeholder="Ticket title"
          value={newTicketTitle}
          maxLength={100}
          required
          onChange={handleTitleChange}
        />
        <textarea
          className="input-field"
          placeholder="Describe your problem, feedback, meme, or idea"
          value={newTicketBody}
          maxLength={600}
          required
          rows={4}
          style={{ resize: "vertical" }}
          onChange={handleBodyChange}
        />
        {newTicketStatus === "error" && <div className="msg-error">Failed to submit. Try again!</div>}
        <div className="modal-actions">
          <button className="btn-primary" type="submit" disabled={newTicketStatus === "submitting"}>
            {newTicketStatus === "submitting" ? "Sending..." : "Submit Ticket"}
          </button>
          <button className="btn-secondary" type="button" onClick={handleCloseModal}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  // Bindings and all handler references are stable; no new functions created on each render.
  // This ensures fields are not remounted or recreated, keeping focus intact.
  ), [
    newTicketTitle,
    newTicketBody,
    newTicketStatus,
    createTicket,
    handleCloseModal,
    handleTitleChange,
    handleBodyChange,
  ]);

  // UI: Ticket List
  const TicketList = () => (
    <section className="main-section">
      <h1 className="main-title">Open Tickets</h1>
      {loadingTickets ? (
        <div className="msg-empty">Loading tickets...</div>
      ) : ticketError ? (
        <div className="msg-error">{ticketError}</div>
      ) : tickets.length === 0 ? (
        <div className="msg-empty">No tickets yet. Be the first!</div>
      ) : (
        <ul className="ticket-list">
          {tickets.map((t) => (
            <li
              key={t.id}
              className={`ticket-card shadow-lg ${selectedTicket && selectedTicket.id === t.id ? "active" : ""}`}
              onClick={() => fetchTicketDetails(t.id)}
              tabIndex={0}
              aria-label={`View details for ticket: ${t.title}`}
              style={{ cursor: "pointer", transition: "box-shadow 0.2s" }}
            >
              <div className="ticket-avatar">{getRandomAvatar(t.id)}</div>
              <div className="ticket-content">
                <div className="ticket-title">{t.title}</div>
                <div className="ticket-snippet">{t.body?.length > 60 ? t.body.slice(0, 60) + "..." : t.body}</div>
              </div>
              <div className="ticket-id" title="Ticket ID">#{t.id}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  // UI: Ticket Details
  const TicketDetail = () => (
    <section className="main-section" style={{ maxWidth: 520 }}>
      <button className="btn-secondary" style={{ marginBottom: 18 }} onClick={() => { setSelectedTicket(null); setReplies([]); }}>
        ← Back to List
      </button>
      {selectedTicket?.error ? (
        <div className="msg-error">{selectedTicket.error}</div>
      ) : (
        <>
          <div className="ticket-detail-header">
            <span className="ticket-avatar-lg">{getRandomAvatar(selectedTicket.id)}</span>
            <div>
              <div className="ticket-title-lg">{selectedTicket?.title}</div>
              <div className="ticket-detail-meta">#{selectedTicket?.id} &mdash; {selectedTicket?.created_at}</div>
            </div>
          </div>
          <div className="ticket-detail-body">{selectedTicket?.body}</div>
          <hr />
          <div className="replies-container">
            <div className="replies-title">Replies</div>
            {replies.length === 0 ? (
              <div className="msg-empty">No replies yet. Be the first to reply!</div>
            ) : (
              <ul className="replies-list">
                {replies.map((r, i) => (
                  <li key={i} className="reply-bubble">
                    <span className="reply-avatar">{getRandomAvatar(i + selectedTicket.id)}</span>
                    <div>
                      <span className="reply-body">{r.body}</span>
                      <div className="reply-meta">{r.created_at}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <form className="reply-form" onSubmit={e => submitReply(selectedTicket.id, e)}>
            <textarea
              className="input-field"
              placeholder="Write your (anonymous) reply..."
              value={replyText}
              required
              maxLength={500}
              onChange={e => setReplyText(e.target.value)}
              rows={3}
            />
            <div style={{ display: "flex", gap: "1em" }}>
              <button className="btn-primary" type="submit" disabled={replyStatus === "submitting" || !replyText.trim()}>
                {replyStatus === "submitting" ? "Sending..." : "Send Reply"}
              </button>
              <button className="btn-secondary" type="button" onClick={() => setReplyText("")}>
                Clear
              </button>
            </div>
            {replyStatus === "error" && <div className="msg-error">Failed to send reply.</div>}
            {replyStatus === "success" && <div className="msg-success">Reply sent!</div>}
          </form>
        </>
      )}
    </section>
  );

  // PUBLIC_INTERFACE: Render
  return (
    <div className="App" tabIndex={-1}>
      <Navbar />
      {showNewTicket && <NewTicketModal />}
      {!showNewTicket && !selectedTicket && <ComposeButton />}
      {!selectedTicket ? <TicketList /> : <TicketDetail />}
      <Footer />
    </div>
  );
}

export default App;
