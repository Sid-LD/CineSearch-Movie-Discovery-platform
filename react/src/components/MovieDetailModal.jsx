import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { useAuth } from '../context/AuthContext'
import {
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    addReview,
    getMovieReviews,
    deleteReview,
} from '../appwriteAuth'

const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const API_OPTIONS = {
    method: 'GET',
    headers: { accept: 'application/json', Authorization: `Bearer ${API_KEY}` },
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

const StarRating = ({ rating, onRate, interactive = false }) => {
    const [hovered, setHovered] = useState(0)
    return (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    className={`star-btn ${(hovered || rating) >= star ? 'filled' : ''}`}
                    onClick={() => interactive && onRate(star)}
                    onMouseEnter={() => interactive && setHovered(star)}
                    onMouseLeave={() => interactive && setHovered(0)}
                    disabled={!interactive}
                    type="button"
                >
                    ★
                </button>
            ))}
        </div>
    )
}

const MovieDetailModal = ({ movie, onClose, onWatchlistChange }) => {
    const { user } = useAuth()
    const [details, setDetails] = useState(null)
    const [cast, setCast] = useState([])
    const [trailer, setTrailer] = useState(null)
    const [watchlistDoc, setWatchlistDoc] = useState(null)
    const [watchlistLoading, setWatchlistLoading] = useState(false)
    const [reviews, setReviews] = useState([])
    const [reviewForm, setReviewForm] = useState({ rating: 0, text: '' })
    const [reviewLoading, setReviewLoading] = useState(false)
    const [reviewError, setReviewError] = useState('')
    const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'cast' | 'reviews'
    const [ticketCount, setTicketCount] = useState(1)
    const [isBooking, setIsBooking] = useState(false)

    // Fetch details, credits, videos
    useEffect(() => {
        const fetchAll = async () => {
            const [detailRes, creditsRes, videosRes] = await Promise.all([
                fetch(`${API_BASE_URL}/movie/${movie.id}`, API_OPTIONS),
//                 Title
// Overview
// Runtime
// Genres
// Budget
// Release Date
                fetch(`${API_BASE_URL}/movie/${movie.id}/credits`, API_OPTIONS),
                // Robert Downey Jr.
// Chris Evans
// Scarlett Johansson
                fetch(`${API_BASE_URL}/movie/${movie.id}/videos`, API_OPTIONS),
//                 Trailer
// Teaser
// Behind the Scenes
// Interview
            ])
            const [detailData, creditsData, videosData] = await Promise.all([
                detailRes.json(),
                creditsRes.json(),
                videosRes.json(),
            ])
            setDetails(detailData)
            setCast(creditsData.cast?.slice(0, 8) || [])
            const yt = videosData.results?.find(
                (v) => v.type === 'Trailer' && v.site === 'YouTube'
            )
            setTrailer(yt || null)
        }
        fetchAll()
    }, [movie.id])

    // Check watchlist
    useEffect(() => {
        if (!user) return //u must be logged in before adding to watchlist
        isInWatchlist(user.$id, movie.id).then(setWatchlistDoc).catch(() => {})
    }, [user, movie.id])

    // Load reviews
    useEffect(() => {
        getMovieReviews(movie.id).then(setReviews).catch(() => {})
    }, [movie.id])

    const toggleWatchlist = async () => {
        if (!user) return
        setWatchlistLoading(true)
        try {
            if (watchlistDoc) {
                await removeFromWatchlist(watchlistDoc.$id)
                setWatchlistDoc(null)
                onWatchlistChange?.(-1)
            } else {
                const doc = await addToWatchlist(user.$id, movie)
                setWatchlistDoc(doc)
                onWatchlistChange?.(1)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setWatchlistLoading(false)
        }
    }

    const submitReview = async (e) => {
        e.preventDefault()
        if (!reviewForm.rating) { setReviewError('Please select a rating.'); return }
        if (!reviewForm.text.trim()) { setReviewError('Review cannot be empty.'); return }
        setReviewLoading(true)
        setReviewError('')
        try {
            const newReview = await addReview(
                user.$id,
                user.name,
                movie.id,
                movie.title,
                reviewForm.rating,
                reviewForm.text.trim()
            )
            setReviews([newReview, ...reviews])
            setReviewForm({ rating: 0, text: '' })
        } catch (e) {
            setReviewError(e?.message || 'Failed to submit review.')
        } finally {
            setReviewLoading(false)
        }
    }

    const handleDeleteReview = async (docId) => {
        try {
            await deleteReview(docId)
            setReviews(reviews.filter((r) => r.$id !== docId))
        } catch (e) {
            console.error(e)
        }
    }

    const handleBookTickets = async () => {
        setIsBooking(true)
        try {
            let response
            try {
                response = await fetch('http://localhost:4242/api/create-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ movie, ticketCount })
                })
            } catch (networkErr) {
                throw new Error('Cannot reach the backend server at localhost:4242. Make sure you ran "npm run dev" in the backend folder.')
            }

            const session = await response.json()
            if (session.error) throw new Error(`Stripe error: ${session.error}`)
            if (!session.url) throw new Error('No checkout URL returned from server.')

            // Redirect directly to Stripe Checkout (modern approach)
            window.location.href = session.url
        } catch (e) {
            console.error('Booking failed:', e)
            alert(`Booking failed:\n\n${e.message}`)
            setIsBooking(false)
        }
    }

    const backdrop = details?.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`
        : null
    const poster = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : '/no-movie.png'
    const runtime = details?.runtime
        ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
        : null
    const genres = details?.genres?.map((g) => g.name).join(' · ') || ''

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>✕</button>

                {/* Backdrop */}
                <div
                    className="detail-backdrop"
                    style={{ backgroundImage: backdrop ? `url(${backdrop})` : 'none' }}
                >
                    <div className="detail-backdrop-overlay" />
                </div>

                <div className="detail-content">
                    {/* Left: poster */}
                    <div className="detail-poster-wrap">
                        <img src={poster} alt={movie.title} className="detail-poster" />
                        {user && (
                            <button
                                id={`watchlist-btn-${movie.id}`}
                                className={`watchlist-toggle-btn ${watchlistDoc ? 'in-watchlist' : ''}`}
                                onClick={toggleWatchlist}
                                disabled={watchlistLoading}
                            >
                                {watchlistLoading
                                    ? '...'
                                    : watchlistDoc
                                        ? '✅ In Watchlist'
                                        : '+ Add to Watchlist'}
                            </button>
                        )}
                        {!user && (
                            <p className="login-prompt">Sign in to add to watchlist</p>
                        )}
                    </div>

                    {/* Right: info */}
                    <div className="detail-info">
                        <h2 className="detail-title">{movie.title}</h2>

                        <div className="detail-meta">
                            {movie.vote_average > 0 && (
                                <span className="meta-chip rating-chip">
                                    ⭐ {movie.vote_average.toFixed(1)}
                                </span>
                            )}
                            {movie.release_date && (
                                <span className="meta-chip">
                                    📅 {movie.release_date.split('-')[0]}
                                </span>
                            )}
                            {runtime && <span className="meta-chip">🕐 {runtime}</span>}
                        </div>

                        {genres && <p className="detail-genres">{genres}</p>}

                        {/* Trailer button */}
                        {trailer && (
                            <a
                                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="trailer-btn"
                            >
                                ▶ Watch Trailer
                            </a>
                        )}

                        {/* Ticket Booking */}
                        <div className="ticket-booking" style={{ marginTop: '20px', padding: '16px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px' }}>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎫 Book Tickets</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                    <button style={{ padding: '10px 16px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }} onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}>−</button>
                                    <span style={{ padding: '0 16px', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', minWidth: '40px', textAlign: 'center', lineHeight: '42px' }}>{ticketCount}</span>
                                    <button style={{ padding: '10px 16px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }} onClick={() => setTicketCount(ticketCount + 1)}>+</button>
                                </div>
                                <button
                                    style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: isBooking ? 'not-allowed' : 'pointer', opacity: isBooking ? 0.7 : 1, transition: 'opacity 0.2s' }}
                                    onClick={handleBookTickets}
                                    disabled={isBooking}
                                >
                                    {isBooking ? '⏳ Processing...' : `🎟 Book ${ticketCount} Ticket${ticketCount > 1 ? 's' : ''} · $${ticketCount * 15}`}
                                </button>
                            </div>
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#666' }}>Secure payment via Stripe · $15.00 per ticket</p>
                        </div>

                        {/* Tabs */}
                        <div className="detail-tabs">
                            {['overview', 'cast', 'reviews'].map((tab) => (
                                <button
                                    key={tab}
                                    className={`detail-tab ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    {tab === 'reviews' && reviews.length > 0 && (
                                        <span className="tab-count"> ({reviews.length})</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className="detail-tab-content">
                            {activeTab === 'overview' && (
                                <p className="detail-overview">
                                    {details?.overview || movie.overview || 'No overview available.'}
                                </p>
                            )}

                            {activeTab === 'cast' && (
                                <div className="cast-grid">
                                    {cast.length === 0 && <p className="no-data">No cast info available.</p>}
                                    {cast.map((actor) => (
                                        <div key={actor.id} className="cast-card">
                                            <img
                                                src={actor.profile_path
                                                    ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                                                    : 'https://via.placeholder.com/90x120?text=?'}
                                                alt={actor.name}
                                                className="cast-photo"
                                            />
                                            <p className="cast-name">{actor.name}</p>
                                            <p className="cast-character">{actor.character}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="reviews-section">
                                    {/* Review form */}
                                    {user ? (
                                        <form className="review-form" onSubmit={submitReview}>
                                            <p className="review-form-title">Leave a Review</p>
                                            <StarRating
                                                rating={reviewForm.rating}
                                                onRate={(r) => setReviewForm({ ...reviewForm, rating: r })}
                                                interactive
                                            />
                                            <textarea
                                                className="review-textarea"
                                                placeholder="Share your thoughts about this movie..."
                                                value={reviewForm.text}
                                                onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                                                rows={3}
                                            />
                                            {reviewError && <p className="auth-error">⚠️ {reviewError}</p>}
                                            <button
                                                type="submit"
                                                className="review-submit-btn"
                                                disabled={reviewLoading}
                                            >
                                                {reviewLoading ? 'Submitting...' : 'Submit Review'}
                                            </button>
                                        </form>
                                    ) : (
                                        <p className="login-prompt">Sign in to leave a review.</p>
                                    )}

                                    {/* Reviews list */}
                                    {reviews.length === 0 && (
                                        <p className="no-data">No reviews yet. Be the first!</p>
                                    )}
                                    {reviews.map((r) => (
                                        <div key={r.$id} className="review-card">
                                            <div className="review-header">
                                                <div className="review-author-wrap">
                                                    <span className="review-avatar">
                                                        {r.username?.[0]?.toUpperCase() || 'U'}
                                                    </span>
                                                    <div>
                                                        <p className="review-author">{r.username}</p>
                                                        <p className="review-date">
                                                            {new Date(r.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="review-right">
                                                    <StarRating rating={r.rating} />
                                                    {user?.$id === r.user_id && (
                                                        <button
                                                            className="review-delete-btn"
                                                            onClick={() => handleDeleteReview(r.$id)}
                                                        >
                                                            🗑
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="review-text">{r.review_text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MovieDetailModal
