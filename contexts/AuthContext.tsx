"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  redirectPath: string | null;
  setRedirectPath: (path: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [redirectPath, setRedirectPathState] = useState<string | null>(null);
  const router = useRouter();

  // Load state from localStorage on mount
  useEffect(() => {
    const authState = localStorage.getItem("auth_authenticated");
    if (authState === "true") {
      setIsAuthenticated(true);
    }
    const path = sessionStorage.getItem("auth_redirect_path");
    if (path) {
      setRedirectPathState(path);
    }
  }, []);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem("auth_authenticated", "true");
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("auth_authenticated");
    router.push("/auth");
  };

  const setRedirectPath = (path: string | null) => {
    setRedirectPathState(path);
    if (path) {
      sessionStorage.setItem("auth_redirect_path", path);
    } else {
      sessionStorage.removeItem("auth_redirect_path");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        redirectPath,
        setRedirectPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
