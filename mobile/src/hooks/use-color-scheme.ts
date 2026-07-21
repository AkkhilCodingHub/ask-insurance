import { useLanguage } from '@/context/agent';

export function useColorScheme(): 'light' | 'dark' {
  try {
    const { darkMode } = useLanguage();
    return darkMode ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}
