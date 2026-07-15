import { useState } from 'react'
import { createAccount, login } from '../appwriteAuth'
import { useAuth } from '../context/AuthContext'

const AuthModal = ({ onClose }) => {
    const { setUser } = useAuth()
    const [mode, setMode] = useState('login') // 'login' | 'signup'
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (mode === 'signup') {
                if (form.name.trim().length < 2) {
                    setError('Name must be at least 2 characters.')
                    setLoading(false)
                    return
                }
                await createAccount(form.email, form.password, form.name)
            } else {
                await login(form.email, form.password)
            }

            // Fetch updated user and close modal
            const { getCurrentUser } = await import('../appwriteAuth')
            const user = await getCurrentUser()
            setUser(user)
            onClose()
        } catch (err) {
            setError(err?.message || 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                {/* Close button */}
                <button className="modal-close-btn" onClick={onClose}>✕</button>

                {/* Header */}
                <div className="auth-modal-header">
                    <h2 className="auth-modal-title">
                        {mode === 'login' ? '👋 Welcome Back' : '🎬 Join CineSearch'}
                    </h2>
                    <p className="auth-modal-subtitle">
                        {mode === 'login'
                            ? 'Sign in to your account to continue'
                            : 'Create an account to track movies & leave reviews'}
                    </p>
                </div>

                {/* Tab toggle */}
                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => { setMode('login'); setError('') }}
                    >
                        Login
                    </button>
                    <button
                        className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                        onClick={() => { setMode('signup'); setError('') }}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Form */}
                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'signup' && (
                        <div className="form-group">
                            <label htmlFor="auth-name">Full Name</label>
                            <input
                                id="auth-name"
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                value={form.name}
                                onChange={handleChange}
                                required
                                autoComplete="name"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="auth-email">Email</label>
                        <input
                            id="auth-email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="auth-password">Password</label>
                        <input
                            id="auth-password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={8}
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        />
                    </div>

                    {error && <p className="auth-error">⚠️ {error}</p>}

                    <button
                        id="auth-submit-btn"
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading
                            ? 'Please wait...'
                            : mode === 'login'
                                ? 'Sign In'
                                : 'Create Account'}
                    </button>
                </form>

                <p className="auth-switch">
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        className="auth-switch-btn"
                        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
                    >
                        {mode === 'login' ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    )
}

export default AuthModal
