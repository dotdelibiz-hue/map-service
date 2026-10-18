import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type GuideLanguage = 'ja' | 'en';

interface Settings {
  kidsMode: boolean;
  guideLanguage: GuideLanguage;
  /** デモ用: 現地判定をスキップして、どこからでも現地限定の機能を試せる */
  skipLocationCheck: boolean;
}

interface SettingsState extends Settings {
  setKidsMode: (v: boolean) => void;
  setGuideLanguage: (v: GuideLanguage) => void;
  setSkipLocationCheck: (v: boolean) => void;
}

const KEY = 'rekitabi.settings';
const DEFAULTS: Settings = { kidsMode: false, guideLanguage: 'ja', skipLocationCheck: false };

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    // 読めない場合は初期値
  }
  return DEFAULTS;
}

function save(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // 保存できない環境では、その画面を開いている間だけ有効
  }
}

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);

  const patch = useCallback((p: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...p };
      save(next);
      return next;
    });
  }, []);

  const value = useMemo<SettingsState>(
    () => ({
      ...settings,
      setKidsMode: (v) => patch({ kidsMode: v }),
      setGuideLanguage: (v) => patch({ guideLanguage: v }),
      setSkipLocationCheck: (v) => patch({ skipLocationCheck: v }),
    }),
    [settings, patch],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
