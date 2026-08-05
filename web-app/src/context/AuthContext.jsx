import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [username, setUsername] = useState(localStorage.getItem('admin_username'));

  const signIn = (newToken, user) => {
    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_username', user.username);
    setToken(newToken);
    setUsername(user.username);
  };

  const signOut = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, signIn, signOut, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
