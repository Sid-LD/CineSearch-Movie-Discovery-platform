import React from 'react';

const TicketsModal = ({ tickets, onClose }) => {
    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
            <div className="auth-modal" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>✕</button>
                <h2 className="auth-modal-title" style={{ marginBottom: '20px' }}>🎟 My Tickets</h2>
                
                {tickets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#a0a0a0' }}>
                        <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>No tickets yet!</p>
                        <p style={{ fontSize: '0.9rem' }}>Book some movies to see your tickets here.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {tickets.map((ticket, index) => (
                            <div key={index} style={{ display: 'flex', gap: '15px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {ticket.moviePoster ? (
                                    <img 
                                        src={`https://image.tmdb.org/t/p/w200${ticket.moviePoster}`} 
                                        alt={ticket.movieTitle} 
                                        style={{ width: '80px', height: '120px', objectFit: 'cover', borderRadius: '8px' }} 
                                    />
                                ) : (
                                    <div style={{ width: '80px', height: '120px', backgroundColor: '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        🎬
                                    </div>
                                )}
                                
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#fff' }}>{ticket.movieTitle}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ backgroundColor: '#6366f1', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                            {ticket.ticketCount} Ticket{ticket.ticketCount > 1 ? 's' : ''}
                                        </span>
                                        <span style={{ color: '#a0a0a0', fontSize: '0.85rem' }}>
                                            Total: ${(parseInt(ticket.ticketCount) * 15).toFixed(2)}
                                        </span>
                                    </div>
                                    <p style={{ margin: '10px 0 0 0', fontSize: '0.75rem', color: '#666' }}>
                                        Purchased on: {new Date(ticket.purchasedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketsModal;
