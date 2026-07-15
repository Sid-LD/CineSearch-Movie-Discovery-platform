import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const Navbar = ({ onAuthClick, onWatchlistClick, watchlistCount, onTicketsClick, ticketsCount }) => {
    const { user, logout } = useAuth()
    const [menuOpen, setMenuOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        setMenuOpen(false)
    }

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <span className="navbar-icon">🎬</span>
                <span className="navbar-title">CineSearch</span>
            </div>

            <div className="navbar-actions">
                {user ? (
                    <>
                        <button className="watchlist-btn" onClick={onTicketsClick}>
                            <span>🎟</span>
                            <span>My Tickets</span>
                            {ticketsCount > 0 && (
                                <span className="watchlist-badge" style={{ backgroundColor: '#6366f1' }}>{ticketsCount}</span>
                            )}
                        </button>

                        <button className="watchlist-btn" onClick={onWatchlistClick}>
                            <span>📋</span>
                            <span>Watchlist</span>
                            {watchlistCount > 0 && (
                                <span className="watchlist-badge">{watchlistCount}</span>
                            )}
                        </button>

                        <div className="user-menu-wrapper">
                            <button
                                className="user-avatar-btn"
                                onClick={() => setMenuOpen(!menuOpen)}
                            >
                                <span className="user-avatar">
                                    {user.name ? user.name[0].toUpperCase() : 'U'}
                                </span>
                                <span className="user-name">
                                    {user.name?.split(' ')[0]}
                                </span>
                                <span className="chevron">{menuOpen ? '▲' : '▼'}</span>
                            </button>

                            {menuOpen && (
                                <div className="user-dropdown">
                                    <p className="dropdown-email">{user.email}</p>
                                    <button className="dropdown-logout" onClick={handleLogout}>
                                        🚪 Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <button className="sign-in-btn" onClick={onAuthClick}>
                        Sign In
                    </button>
                )}
            </div>
        </nav>
    )
}

export default Navbar
