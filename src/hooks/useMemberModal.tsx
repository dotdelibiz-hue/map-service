import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { MemberModal } from '../components/layout/MemberModal';

const MemberModalContext = createContext<{ open: () => void } | null>(null);

/** 「メンバーになりませんか？」モーダル。ログインが必要な操作をしたときに表示します */
export function MemberModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const value = useMemo(() => ({ open: () => setOpen(true) }), []);
  return (
    <MemberModalContext.Provider value={value}>
      {children}
      {isOpen && <MemberModal onClose={() => setOpen(false)} />}
    </MemberModalContext.Provider>
  );
}

export function useMemberModal() {
  const ctx = useContext(MemberModalContext);
  if (!ctx) throw new Error('useMemberModal must be used inside MemberModalProvider');
  return ctx;
}
