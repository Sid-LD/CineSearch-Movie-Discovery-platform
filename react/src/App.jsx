import React, { useEffect, useState } from 'react'
import Search from './components/Search.jsx'
import Spinner from './components/Spinner.jsx'
import MovieCard from './components/MovieCard.jsx'
import Navbar from './components/Navbar.jsx'
import AuthModal from './components/AuthModal.jsx'
import MovieDetailModal from './components/MovieDetailModal.jsx'
import WatchlistPage from './components/WatchlistPage.jsx'
import TicketsModal from './components/TicketsModal.jsx'
import MovieChatbot from './components/MovieChatbot.jsx'
import { useDebounce } from 'react-use'
import { getTrendingMovies, updateSearchCount } from './appwrite.js'
import { getWatchlist } from './appwriteAuth.js'
import { useAuth } from './context/AuthContext.jsx'

const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const API_OPTIONS = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`,
    },
}

const App = () => {
    const { user } = useAuth()

    const [searchTerm, setSearchTerm] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [movieList, setMovieList] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [trendingMovies, setTrendingMovies] = useState([])

    const [showAuthModal, setShowAuthModal] = useState(false)
    const [showWatchlist, setShowWatchlist] = useState(false)
    const [showTicketsModal, setShowTicketsModal] = useState(false)
    const [selectedMovie, setSelectedMovie] = useState(null)
    const [watchlist, setWatchlist] = useState([])
    const [tickets, setTickets] = useState([])
    const [paymentMessage, setPaymentMessage] = useState('')

    useEffect(() => {
        let savedTickets = []
        try {
            savedTickets = JSON.parse(localStorage.getItem('my_tickets') || '[]')
        } catch (e) {
            console.error('Error parsing tickets from localStorage', e)
            localStorage.removeItem('my_tickets')
        }
        setTickets(savedTickets)

        const query = new URLSearchParams(window.location.search)
        const sessionId = query.get('session_id')
        
        if (query.get('success') && sessionId) {
            // Fetch session details from backend
            fetch(`http://localhost:4242/api/checkout-session/${sessionId}`)
                .then(res => res.json())
                .then(session => {
                    if (session.metadata) {
                        const newTicket = {
                            ...session.metadata,
                            sessionId: session.id,
                            purchasedAt: new Date().toISOString()
                        }
                        
                        // Prevent duplicate adding (if page reloads before URL cleans up)
                        const isDuplicate = savedTickets.some(t => t.sessionId === session.id)
                        if (!isDuplicate) {
                            const updatedTickets = [newTicket, ...savedTickets]
                            setTickets(updatedTickets)
                            localStorage.setItem('my_tickets', JSON.stringify(updatedTickets))
                        }
                    }
                })
                .catch(err => console.error('Failed to fetch session metadata:', err))

            setPaymentMessage('Payment successful! Your tickets have been booked.')
            window.history.replaceState(null, '', window.location.pathname)
        } else if (query.get('canceled')) {
            setPaymentMessage('Payment canceled. You can try booking again when you are ready.')
            window.history.replaceState(null, '', window.location.pathname)
        }
    }, [])

    useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

    const fetchMovies = async (query = '') => {
        setErrorMessage('')
        setIsLoading(true)
        try {
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}` //Search movie api endpoint
                : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc` // discover movie api endpoint

            const response = await fetch(endpoint, API_OPTIONS)
            if (!response.ok) throw new Error('Failed to fetch movies')

            const data = await response.json()
            if (data.Response === 'False') {
                setErrorMessage(data.Error || 'Failed to fetch movies')
                setMovieList([])
                return
            }
            setMovieList(data.results)

            if (query && data.results.length > 0) {
                await updateSearchCount(query, data.results[0])
            }
        } catch (error) {
            console.error(`Error while fetching movies: ${error}`)
            setErrorMessage('Error fetching movies, please try again')
        } finally {
            setIsLoading(false)
        }
    }

    const loadTrendingMovies = async () => {
        try {
            const movies = await getTrendingMovies()
            setTrendingMovies(movies)
        } catch (error) {
            console.error(error)
        }
    }

    const loadWatchlist = async () => {
        if (!user) { setWatchlist([]); return }
        try {
            const docs = await getWatchlist(user.$id)
            setWatchlist(docs)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => { fetchMovies(debouncedSearchTerm) }, [debouncedSearchTerm])
    useEffect(() => { loadTrendingMovies() }, [])
    useEffect(() => { loadWatchlist() }, [user])

    const handleWatchlistChange = (delta) => {
        // Refresh full watchlist after change
        loadWatchlist()
    }

    const handleRemoveFromWatchlist = (docId) => {
        setWatchlist((prev) => prev.filter((item) => item.$id !== docId))
    }

    return (
        <main>
            <div className="pattern" />

            <div className="wrapper">
                <Navbar
                    onAuthClick={() => setShowAuthModal(true)}
                    onWatchlistClick={() => setShowWatchlist(true)}
                    watchlistCount={watchlist.length}
                    onTicketsClick={() => setShowTicketsModal(true)}
                    ticketsCount={tickets.length}
                />

                <header>
                    <img src="/hero.png" alt="Hero Banner" />
                    <h1>
                        Find <span className="text-gradient">Movies</span> You will enjoy without the hassle
                    </h1>
                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>

                {trendingMovies && trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2>Trending Movies</h2>
                        {isLoading ? (
                            <p className="text-zinc-200"><Spinner /></p>
                        ) : errorMessage ? (
                            <p className="text-red-700">{errorMessage}</p>
                        ) : (
                            <ul>
                                {trendingMovies && trendingMovies.map((movie, index) => (
                                    <li key={movie.$id}>
                                        <p>{index + 1}</p>
                                        <img src={movie.poster_url} alt={movie.title} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}

                <section className="all-movies">
                    <h2>All Movies</h2>
                    {isLoading ? (
                        <p className="text-zinc-300"><Spinner /></p>
                    ) : errorMessage ? (
                        <p className="text-red-600">{errorMessage}</p>
                    ) : (
                        <ul>
                            {movieList.map((movie) => (
                                <MovieCard
                                    key={movie.id}
                                    movie={movie}
                                    onClick={() => setSelectedMovie(movie)}
                                />
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            {/* Modals */}
            {showAuthModal && (
                <AuthModal onClose={() => setShowAuthModal(false)} />
            )}

            {selectedMovie && (
                <MovieDetailModal
                    movie={selectedMovie}
                    onClose={() => setSelectedMovie(null)}
                    onWatchlistChange={handleWatchlistChange}
                />
            )}

            {showWatchlist && (
                <WatchlistPage
                    watchlist={watchlist}
                    onClose={() => setShowWatchlist(false)}
                    onMovieClick={(movie) => setSelectedMovie(movie)}
                    onRemove={handleRemoveFromWatchlist}
                />
            )}

            {showTicketsModal && (
                <TicketsModal tickets={tickets} onClose={() => setShowTicketsModal(false)} />
            )}

            {/* AI Movie Chatbot */}
            <MovieChatbot />

            {/* Payment Message Modal */}
            {paymentMessage && (
                <div className="modal-overlay" onClick={() => setPaymentMessage('')}>
                    <div className="auth-modal" style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setPaymentMessage('')}>✕</button>
                        <h2 className="auth-modal-title" style={{ marginTop: '20px' }}>
                            {paymentMessage.includes('successful') ? '🎉 Success!' : 'ℹ️ Notice'}
                        </h2>
                        <p style={{ margin: '20px 0', color: '#a0a0a0', lineHeight: '1.5' }}>{paymentMessage}</p>
                        <button className="auth-submit-btn" onClick={() => setPaymentMessage('')}>Continue</button>
                    </div>
                </div>
            )}
        </main>
    )
}

export default App
