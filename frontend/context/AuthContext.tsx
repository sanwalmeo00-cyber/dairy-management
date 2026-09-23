'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { partnerA, partnerB, superAdmin, mockUsers as seedUsers } from '@/data/mock/users';
import type { Role, User } from '@/types/farm';
import { canModify, isOwner, isSuperAdmin } from '@/lib/ownership';

type LoginPortal = 'user' | 'superuser';

interface AuthContextValue {
  currentUser: User;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  users: User[];
  login: (email: string, password: string, portal: LoginPortal) => { ok: boolean; message?: string };
  register: (data: { name: string; email: string; password: string }) => boolean;
  logout: () => void;
  createUser: (data: { name: string; email: string; phone?: string }) => { ok: boolean; message?: string };
  setUserStatus: (userId: string, status: 'Active' | 'Inactive') => void;
  switchPartner: (userId: string) => void;
  isOwnerOf: (ownerId: string) => boolean;
  canModifyRecord: (ownerId: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'gfms-current-user';
const AUTH_KEY = 'gfms-authenticated';
const PORTAL_KEY = 'gfms-portal';
const USERS_KEY = 'gfms-users';

function findSeedUser(id: string | null): User {
  if (!id) return partnerA;
  return seedUsers.find((u) => u.id === id) ?? partnerA;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(partnerA);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<User[]>(seedUsers);

  useEffect(() => {
    try {
      const rawUsers = localStorage.getItem(USERS_KEY);
      if (rawUsers) {
        const parsed = JSON.parse(rawUsers) as User[];
        if (Array.isArray(parsed) && parsed.length) setUsers(parsed);
      }
    } catch {
      /* ignore */
    }

    const id = localStorage.getItem(STORAGE_KEY);
    const auth = localStorage.getItem(AUTH_KEY) === '1';
    setCurrentUser(findSeedUser(id));
    setIsAuthenticated(auth);
  }, []);

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  const login = useCallback(
    (email: string, _password: string, portal: LoginPortal) => {
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
      if (!user) {
        return { ok: false, message: 'Account not found.' };
      }
      if (user.status === 'Inactive') {
        return { ok: false, message: 'This account is inactive.' };
      }

      if (portal === 'superuser' && user.role !== 'SUPER_ADMIN') {
        return {
          ok: false,
          message: 'This is a farm user account. Please use the user login page.',
        };
      }
      if (portal === 'user' && user.role === 'SUPER_ADMIN') {
        return {
          ok: false,
          message: 'Super Admin must sign in at /superuser/login.',
        };
      }

      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY, user.id);
      localStorage.setItem(AUTH_KEY, '1');
      localStorage.setItem(PORTAL_KEY, portal);
      return { ok: true };
    },
    [users]
  );

  const register = useCallback((data: { name: string; email: string; password: string }) => {
    const exists = users.some((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) return false;

    const user: User = {
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: 'USER',
      createdBy: 'admin-1',
      status: 'Active',
    };
    setUsers((prev) => [...prev, user]);
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEY, user.id);
    localStorage.setItem(AUTH_KEY, '1');
    localStorage.setItem(PORTAL_KEY, 'user');
    return true;
  }, [users]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(PORTAL_KEY);
  }, []);

  const createUser = useCallback(
    (data: { name: string; email: string; phone?: string }) => {
      if (!isSuperAdmin(currentUser)) {
        return { ok: false, message: 'Only Super Admin can create users.' };
      }
      if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
        return { ok: false, message: 'Email already exists.' };
      }
      const user: User = {
        id: `user-${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'USER' as Role,
        createdBy: currentUser.id,
        status: 'Active',
      };
      setUsers((prev) => [...prev, user]);
      return { ok: true };
    },
    [currentUser, users]
  );

  const setUserStatus = useCallback((userId: string, status: 'Active' | 'Inactive') => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
  }, []);

  const switchPartner = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user || user.role === 'SUPER_ADMIN') return;
      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEY, user.id);
      localStorage.setItem(PORTAL_KEY, 'user');
    },
    [users]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isAuthenticated,
      isSuperAdmin: isSuperAdmin(currentUser),
      users,
      login,
      register,
      logout,
      createUser,
      setUserStatus,
      switchPartner,
      isOwnerOf: (ownerId: string) => isOwner(ownerId, currentUser.id),
      canModifyRecord: (ownerId: string) => canModify(ownerId, currentUser),
    }),
    [
      currentUser,
      isAuthenticated,
      users,
      login,
      register,
      logout,
      createUser,
      setUserStatus,
      switchPartner,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// keep named exports for seed references
export { partnerA, partnerB, superAdmin };
