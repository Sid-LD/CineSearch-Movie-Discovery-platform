import { useAuth } from '../context/AuthContext'
import { removeFromWatchlist } from '../appwriteAuth'

const WatchlistPage = ({ watchlist, onClose, onRemove }) => {
    const { user } = useAuth()

    const handleRemove = async (doc) => {
        try {
            await removeFromWatchlist(doc.$id)
            onRemove(doc.$id)
        } catch (e) {
            console.error(e)
        }
    }

    if (!user) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="watchlist-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="modal-close-btn" onClick={onClose}>✕</button>
                    <h2 className="watchlist-title">My Watchlist</h2>
                    <p className="no-data">Please sign in to view your watchlist.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="watchlist-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>✕</button>

                <div className="watchlist-header">
                    <h2 className="watchlist-title">📋 My Watchlist</h2>
                    <span className="watchlist-count">{watchlist.length} movie{watchlist.length !== 1 ? 's' : ''}</span>
                </div>

                {watchlist.length === 0 ? (
                    <div className="watchlist-empty">
                        <p className="watchlist-empty-icon">🎬</p>
                        <p className="no-data">Your watchlist is empty.</p>
                        <p className="no-data-sub">Browse movies and click "+ Add to Watchlist"</p>
                    </div>
                ) : (
                    <div className="watchlist-grid">
                        {watchlist.map((item) => (
                            <div key={item.$id} className="watchlist-card">
                                <img
                                    src={item.poster_url || '/no-movie.png'}
                                    alt={item.title}
                                    className="watchlist-poster"
                                />
                                <div className="watchlist-card-info">
                                    <h3 className="watchlist-card-title">{item.title}</h3>
                                    <div className="watchlist-card-meta">
                                        {item.vote_average > 0 && (
                                            <span>⭐ {Number(item.vote_average).toFixed(1)}</span>
                                        )}
                                        {item.release_date && (
                                            <span>📅 {item.release_date.split('-')[0]}</span>
                                        )}
                                    </div>
                                    <button
                                        className="watchlist-remove-btn"
                                        onClick={() => handleRemove(item)}
                                    >
                                        🗑 Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default WatchlistPage
