import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [loadingToken, setLoadingToken] = useState(true);

  useEffect(() => {
    const match = document.cookie.match(/token=([^;]+)/);
    if (match) setToken(match[1]);
    setLoadingToken(false);
  }, []);

  const login = (newToken) => {
    document.cookie = `token=${newToken}; path=/; max-age=31536000`;
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
    document.cookie = "token=; path=/; max-age=0";
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, loadingToken }}>
      {children}
    </AuthContext.Provider>
  );
};
