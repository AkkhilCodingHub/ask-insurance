import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { agentApi, AgentAdmin, getAgentToken, setAgentToken, clearAgentToken } from '@/lib/api';

interface AgentContextValue {
  agent:   AgentAdmin | null;
  loading: boolean;
  login:   (email: string, password: string) => Promise<void>;
  logout:  () => Promise<void>;
  refreshAgent: () => Promise<void>;
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
          // Fetch freshest profile from API (includes status)
          const admin = await agentApi.getProfile();
          const SecureStore = await import('expo-secure-store');
          await SecureStore.setItemAsync('agent_profile', JSON.stringify(admin));
          setAgent(admin);
        }
      } catch {
        try {
          const saved = await import('expo-secure-store').then(m =>
            m.getItemAsync('agent_profile')
          );
          if (saved) setAgent(JSON.parse(saved));
        } catch {
          await clearAgentToken();
        }
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

  const refreshAgent = async () => {
    try {
      const admin = await agentApi.getProfile();
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync('agent_profile', JSON.stringify(admin));
      setAgent(admin);
    } catch (e) {
      console.warn('[refreshAgent] error:', e);
    }
  };

  return (
    <AgentContext.Provider value={{ agent, loading, login, logout, refreshAgent }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgent must be used within AgentProvider');
  return ctx;
}
