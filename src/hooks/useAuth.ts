import { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { authService } from "../services/authService";
import { User } from "../types/user.types";

/**
 * Custom hook for authentication
 */
export const useAuth = () => {
  const { accounts } = useMsal(); // ✅ removed unused "instance"
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (accounts.length > 0) {
      const account = accounts[0];
      const roles = authService.getUserRoles();

      setUser({
        id: account.localAccountId,
        email: account.username,
        name: account.name || "",
        displayName: account.name,
        roles,
      });
    } else {
      setUser(null); // ✅ good hygiene when logging out / switching accounts
    }

    setIsLoading(false);
  }, [accounts]);

  const login = async () => {
    await authService.login();
  };

  const logout = async () => {
    await authService.logout();
  };

  const hasRole = (role: string): boolean => authService.hasRole(role);

  const hasAnyRole = (roles: string[]): boolean => authService.hasAnyRole(roles);

  return {
    user,
    isAuthenticated: accounts.length > 0,
    isLoading,
    login,
    logout,
    hasRole,
    hasAnyRole,
    userRoles: user?.roles || [],
  };
};
