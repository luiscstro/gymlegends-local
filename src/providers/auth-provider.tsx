import { createContext, useContext, type PropsWithChildren } from 'react';

import { LOCAL_UID } from '@/lib/data/local-db';

/**
 * Sem login: um único usuário local por navegador. Mantém a mesma API (`useAuth().user.uid`)
 * para as telas funcionarem igual à versão com contas.
 */
export interface LocalUser {
  uid: string;
}

interface AuthContextValue {
  user: LocalUser;
  loading: false;
}

const value: AuthContextValue = { user: { uid: LOCAL_UID }, loading: false };
const AuthContext = createContext<AuthContextValue>(value);

export function AuthProvider({ children }: PropsWithChildren) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
