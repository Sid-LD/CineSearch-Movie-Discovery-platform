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
        <AuthContext.Provider value={{ user, setUser, logout, loading }}> //
            {children}
        </AuthContext.Provider>
    )
     //<AuthContext.Provider>: Think of this as a broadcast tower. It broadcasts whatever is passed to its value prop (in this case, an object containing user, setUser, logout, and loading) to all components inside it.
// {children}: This is a special React prop. It refers to whatever components are wrapped inside <AuthProvider>.
}

export const useAuth = () => useContext(AuthContext)

// 2. What is useAuth?
// Instead of components writing this long line every time:

// javascript
// import { useContext } from 'react';
// import { AuthContext } from '../context/AuthContext';
// const { user } = useContext(AuthContext);
// You create a custom helper hook:

// javascript
// export const useAuth = () => useContext(AuthContext);
// Now, any component in your project can get the auth data with a single clean line:

// javascript
// const { user, logout, setUser } = useAuth();