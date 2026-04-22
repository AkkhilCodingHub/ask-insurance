import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { agentApi, AgentAdmin, getAgentToken, setAgentToken, clearAgentToken } from '@/lib/api';

interface AgentContextValue {
  agent:   AgentAdmin | null;
  loading: boolean;
  login:   (email: string, password: string) => Promise<void>;
  logout:  () => Promise<void>;
}

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agent,   setAgent]   = useState<AgentAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await getAgentToken();
        if (token) {
          // Quick validation: hit any authenticated endpoint; use getPolicies page 1
          await agentApi.getPolicies(undefined, 1);
          // Token stored separately — we don't have a /me for admin, so keep what was saved
          const saved = await import('expo-secure-store').then(m =>
            m.getItemAsync('agent_profile')
          );
          if (saved) setAgent(JSON.parse(saved));
        }
      } catch {
        await clearAgentToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const { token, admin } = await agentApi.login(email, password);
    await setAgentToken(token);
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync('agent_profile', JSON.stringify(admin));
    setAgent(admin);
  };

  const logout = async () => {
    await clearAgentToken();
    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync('agent_profile');
    setAgent(null);
  };

  return (
    <AgentContext.Provider value={{ agent, loading, login, logout }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgent must be used within AgentProvider');
  return ctx;
}
