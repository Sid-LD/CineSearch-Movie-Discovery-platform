import { Client, Account, Databases, ID, Query } from "appwrite"

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const WATCHLIST_COLLECTION_ID = import.meta.env.VITE_APPWRITE_WATCHLIST_COLLECTION_ID
const REVIEWS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_REVIEWS_COLLECTION_ID

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject(PROJECT_ID)

const account = new Account(client)
const database = new Databases(client)

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const createAccount = async (email, password, name) => {
    await account.create(ID.unique(), email, password, name)
    return login(email, password)
}

export const login = async (email, password) => {
    return await account.createEmailPasswordSession(email, password)
}

export const logout = async () => {
    return await account.deleteSession('current')
}

export const getCurrentUser = async () => {
    try {
        return await account.get()
    } catch {
        return null
    }
}

// ─── WATCHLIST ───────────────────────────────────────────────────────────────

export const addToWatchlist = async (userId, movie) => {
    return await database.createDocument(DATABASE_ID, WATCHLIST_COLLECTION_ID, ID.unique(), {
        user_id: userId,
        movie_id: String(movie.id),
        title: movie.title,
        poster_url: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : '',
        vote_average: movie.vote_average || 0,
        release_date: movie.release_date || '',
    })
}

export const removeFromWatchlist = async (documentId) => {
    return await database.deleteDocument(DATABASE_ID, WATCHLIST_COLLECTION_ID, documentId)
}

export const getWatchlist = async (userId) => {
    const result = await database.listDocuments(DATABASE_ID, WATCHLIST_COLLECTION_ID, [
        Query.equal('user_id', userId),
        Query.orderDesc('$createdAt'),
    ])
    return result.documents
}

export const isInWatchlist = async (userId, movieId) => {
    const result = await database.listDocuments(DATABASE_ID, WATCHLIST_COLLECTION_ID, [
        Query.equal('user_id', userId),
        Query.equal('movie_id', String(movieId)),
    ])
    return result.documents.length > 0 ? result.documents[0] : null
}

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

export const addReview = async (userId, username, movieId, movieTitle, rating, reviewText) => {
    return await database.createDocument(DATABASE_ID, REVIEWS_COLLECTION_ID, ID.unique(), {
        user_id: userId,
        username,
        movie_id: String(movieId),
        movie_title: movieTitle,
        rating: Number(rating),
        review_text: reviewText,
        created_at: new Date().toISOString(),
    })
}

export const getMovieReviews = async (movieId) => {
    const result = await database.listDocuments(DATABASE_ID, REVIEWS_COLLECTION_ID, [
        Query.equal('movie_id', String(movieId)),
        Query.orderDesc('created_at'),
    ])
    return result.documents
}

export const deleteReview = async (documentId) => {
    return await database.deleteDocument(DATABASE_ID, REVIEWS_COLLECTION_ID, documentId)
}
