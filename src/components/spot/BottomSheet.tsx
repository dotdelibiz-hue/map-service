import { useRef, type ReactNode, type PointerEvent } from 'react';
import styles from './spot.module.css';

export type SheetSnap = 'half' | 'full';

/**
 * 下から出てくるシート。ハンドルをタップ / ドラッグすると半分 ⇔ 全画面を切り替えます。
 * 地図は操作できたまま（モーダルにしない）にして、別のスポットへすぐ移れるようにしています。
 */
export function BottomSheet({
  snap,
  onSnapChange,
  children,
  label,
}: {
  snap: SheetSnap;
  onSnapChange: (s: SheetSnap) => void;
  children: ReactNode;
  label: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; dy: number; moved: boolean } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { startY: e.clientY, dy: 0, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || !sheetRef.current) return;
    d.dy = e.clientY - d.startY;
    if (Math.abs(d.dy) > 6) d.moved = true;
    if (d.moved) {
      sheetRef.current.style.transition = 'none';
      sheetRef.current.style.setProperty('--drag', `${d.dy}px`);
    }
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !sheetRef.current) return;
    sheetRef.current.style.transition = '';
    sheetRef.current.style.setProperty('--drag', '0px');
    if (!d.moved) {
      onSnapChange(snap === 'half' ? 'full' : 'half');
    } else if (d.dy < -40) {
      onSnapChange('full');
    } else if (d.dy > 40) {
      onSnapChange('half');
    }
  };

  return (
    <div className={styles.sheetLayer}>
      <section ref={sheetRef} className={`${styles.sheet} ${snap === 'full' ? styles.sheetFull : styles.sheetHalf}`} aria-label={label}>
        <div
          className={styles.handleArea}
          role="button"
          tabIndex={0}
          aria-label="スナップポイントを切り替え"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSnapChange(snap === 'half' ? 'full' : 'half');
            }
          }}
        >
          <div className={styles.handle} />
        </div>
        <div className={styles.sheetContent}>{children}</div>
      </section>
    </div>
  );
}
