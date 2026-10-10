import React from "react";
import { useState } from "react";

export const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      return data;
    } catch (error) {
      console.log("Login failed:", error);
      throw error;
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const { data } = await api.post("/auth/verify-otp", { email, otp });
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      return data;
    } catch (error) {
      console.log("Verify OTP failed:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
      });
      setUser(data);
      return data;
    } catch (error) {
      console.log("Register failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, verifyOtp, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
};
