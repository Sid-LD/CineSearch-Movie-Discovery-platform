import { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, logout as appwriteLogout } from '../appwriteAuth'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        setLoading(false)
    }

    const logout = async () => {
        await appwriteLogout()
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, setUser, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
