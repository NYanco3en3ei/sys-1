import { createContext } from "react";

type UserRole = "admin" | "salesperson" | null;

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole;
  userName: string;
  setIsAuthenticated: (value: boolean) => void;
  setUserRole: (role: UserRole) => void;
  setUserName: (name: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userRole: null,
  userName: "",
  setIsAuthenticated: (value: boolean) => {},
  setUserRole: (role: UserRole) => {},
  setUserName: (name: string) => {},
  logout: () => {},
});