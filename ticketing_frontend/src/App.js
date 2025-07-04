import React, { useState, useEffect } from 'react';
import './App.css';

// Backend API base URL
const API_BASE = 'http://localhost:8000';

function App() {
  // Theme state
  const [theme, setTheme] = useState('light');

  // App state
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketBody, setNewTicketBody] = useState('');
  const [newTicketStatus, setNewTicketStatus] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null); // ticket with details & replies
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('');

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // On mount, fetch all tickets
  useEffect(() => {
    fetchTickets();
  }, []);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // PUBLIC_INTERFACE
  const fetchTickets = async () => {
    setLoadingTickets(true);
    setTicketError('');
    try {
      const res = await fetch(`${API_BASE}/tickets/`);
      if (!res.ok) throw new Error('Error fetching tickets');
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : (data.tickets || []));
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
      if (!res.ok) throw new Error('Error fetching ticket details');
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
    setNewTicketStatus('submitting');
    try {
      const res = await fetch(`${API_BASE}/tickets/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTicketTitle,
          body: newTicketBody,
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to submit ticket');
      }
      setNewTicketTitle('');
      setNewTicketBody('');
      setNewTicketStatus('success');
      setShowNewTicket(false);
      // Refresh ticket list
      fetchTickets();
    } catch (err) {
      setNewTicketStatus('error');
    }
  };

  // PUBLIC_INTERFACE
  const submitReply = async (ticketId, e) => {
    e.preventDefault();
    setReplyStatus('submitting');
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}/reply/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: replyText,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit reply');
      setReplyText('');
      setReplyStatus('success');
      fetchTicketDetails(ticketId); // refresh replies
    } catch (err) {
      setReplyStatus('error');
    }
  };

  // UI: New Ticket Modal
  const NewTicketModal = () => (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
    }}>
      <form
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          padding: 24, borderRadius: 12, minWidth: 320, boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
        }}
        onSubmit={createTicket}
      >
        <h2 style={{margin: '0 0 1.5rem'}}>Submit Anonymous Ticket</h2>
        <div style={{marginBottom: 16}}>
          <input
            style={{width: '100%', padding: 8, borderRadius: 5, border: '1px solid var(--border-color)', fontSize: 16}}
            type="text"
            value={newTicketTitle}
            maxLength={100}
            placeholder="Title"
            required
            onChange={e => setNewTicketTitle(e.target.value)}
          />
        </div>
        <div style={{marginBottom: 16}}>
          <textarea
            style={{width: '100%', padding: 8, borderRadius: 5, border: '1px solid var(--border-color)', fontSize: 16, minHeight: 80}}
            value={newTicketBody}
            maxLength={600}
            placeholder="Describe your problem, feedback, or idea"
            required
            onChange={e => setNewTicketBody(e.target.value)}
          />
        </div>
        <div style={{display: 'flex', gap: 10}}>
          <button className="theme-toggle" style={{width:90}} type="submit" disabled={newTicketStatus === 'submitting'}>Send</button>
          <button className="theme-toggle" type="button" onClick={() => setShowNewTicket(false)}>Cancel</button>
        </div>
        {newTicketStatus === 'error' && <div style={{color:'red', marginTop:12}}>Failed to submit ticket.</div>}
        {newTicketStatus === 'success' && <div style={{color:'green', marginTop:12}}>Ticket submitted!</div>}
      </form>
    </div>
  );

  // UI: Ticket List
  const TicketList = () => (
    <div style={{margin:'0 auto', maxWidth:550, padding: 24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 style={{margin:0}}>🎟️ Anonymous Tickets</h1>
        <button className="theme-toggle" onClick={()=>setShowNewTicket(true)}>+ New Ticket</button>
      </div>
      {loadingTickets ? (
        <div style={{margin: '2rem 0'}}>Loading tickets...</div>
      ) : ticketError ? (
        <div style={{color:'red',margin:'1.5rem 0'}}>{ticketError}</div>
      ) : tickets.length === 0 ? (
        <div style={{margin: '2rem 0'}}>No tickets yet. Be the first to post!</div>
      ) : (
        <ul style={{padding:0,margin:'1.5rem 0 0 0',listStyle:'none'}}>
          {tickets.map(t => (
            <li
              key={t.id}
              style={{
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                padding: '14px 16px',
                borderRadius: 9,
                margin: '0 0 16px 0',
                cursor: 'pointer',
                boxShadow: selectedTicket && selectedTicket.id === t.id ? '0 0 0 2px #4F8FFF' : ''
              }}
              onClick={() => fetchTicketDetails(t.id)}
              tabIndex={0}
              aria-label={`View details for ticket titled ${t.title}`}
            >
              <div style={{fontWeight:600,marginBottom:4}}>{t.title}</div>
              <div style={{fontSize:13, color:'var(--text-secondary)'}}>{t.body?.slice(0,60) + (t.body?.length>60?'...':'')}</div>
              <div style={{fontSize:12,marginTop:6, color:'var(--text-secondary)'}}>id: {t.id}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // UI: Ticket Details & Replies
  const TicketDetail = () => (
    <div style={{margin:'0 auto', maxWidth:500, padding: 24}}>
      <button className="theme-toggle" onClick={()=>{setSelectedTicket(null); setReplies([]);}}>Back to list</button>
      {selectedTicket?.error ? (
        <div style={{color:'red',margin:'2rem 0'}}>{selectedTicket.error}</div>
      ) : (
        <>
          <h2 style={{margin:'1rem 0 0.4rem'}}>{selectedTicket?.title} <span style={{fontSize:'0.65em',color:'#999'}}>#{selectedTicket?.id}</span></h2>
          <div style={{marginBottom:12, color:'var(--text-secondary)'}}>{selectedTicket?.body}</div>
          <div style={{fontSize:13,color:'#999',marginBottom:16}}>Ticket created: {selectedTicket?.created_at}</div>
          <hr style={{borderColor:'var(--border-color)', margin: '16px 0'}} />
          <h3 style={{margin:'8px 0'}}>Replies</h3>
          {replies.length === 0 && <div style={{color:'#999',marginBottom:12}}>No replies yet.</div>}
          <ul style={{padding:0,margin:0,listStyle:'none',marginBottom:16}}>
            {replies.map((r,i) => (
              <li key={i}
                  style={{
                    background:'#f6f6f6',
                    color:'#333',
                    marginBottom:8,
                    borderRadius:7,
                    padding:'8px 14px',
                    fontSize:15,
                    textAlign:'left'
                  }}>
                {r.body}
                <div style={{fontSize:11, color:'#888',marginTop:2}}>at {r.created_at}</div>
              </li>
            ))}
          </ul>
          <form style={{marginTop:16,display:'flex',gap:8,flexDirection:'column',alignItems:'stretch'}} onSubmit={e=>submitReply(selectedTicket.id,e)}>
            <textarea
              style={{padding:8, border:'1px solid var(--border-color)', borderRadius:6, fontSize:15}}
              placeholder="Write a reply..."
              value={replyText}
              required
              maxLength={500}
              onChange={e=>setReplyText(e.target.value)}
              rows={3}
            />
            <div style={{display:'flex',gap:10}}>
              <button className="theme-toggle" type="submit" disabled={replyStatus==='submitting' || !replyText.trim()}>Send Reply</button>
              <button className="theme-toggle" type="button" onClick={()=>setReplyText('')}>Clear</button>
            </div>
            {replyStatus==='error' && <div style={{color:'red',marginTop:7}}>Failed to send reply.</div>}
            {replyStatus==='success' && <div style={{color:'green',marginTop:7, fontWeight:500}}>Reply sent!</div>}
          </form>
        </>
      )}
    </div>
  );

  // UI: HEADER (theme + playful brand)
  const Header = () => (
    <header className="App-header" style={{paddingBottom:24}}>
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
      </button>
      <h1 style={{fontSize:'2.1em',margin:'18px 0 0'}}>AnonTicket 🎫</h1>
      <p style={{fontSize:'1.1em',margin:'5px 0 22px 0',color:'var(--text-secondary)'}}>
        Create and reply to tickets with complete anonymity. No login, just fun!
      </p>
    </header>
  );

  // Main Render
  return (
    <div className="App" style={{minHeight:'100vh',background:'var(--bg-primary)',color:'var(--text-primary)'}}>
      <Header />
      {showNewTicket && <NewTicketModal />}
      {selectedTicket ? <TicketDetail /> : <TicketList />}
      {/* Theme state indicator (optional for fun) */}
      <div style={{
        position: 'fixed', right: 18, bottom: 10,
        color: 'var(--text-secondary)', fontSize: 13,
        background: 'var(--bg-secondary)', borderRadius: 8, padding: '4px 15px', opacity: 0.82
      }}>Theme: <b>{theme}</b></div>
      {/* Footer */}
      <footer style={{
        position:'fixed',bottom:0,left:0,width:'100vw',
        padding:8, color:'#bbb', background:'var(--bg-secondary)',
        textAlign:'center', fontSize:12, opacity:0.92, zIndex:10, borderTop:'1px solid var(--border-color)'
      }}>
        AnonTicket &copy; {new Date().getFullYear()} &minus; No authentication, just fun.
      </footer>
    </div>
  );
}

export default App;
