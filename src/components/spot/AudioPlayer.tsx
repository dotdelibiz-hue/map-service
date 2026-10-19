import { useState } from 'react';
import type { HistoricSite } from '../../types';
import { formatTime, useNarration } from '../../hooks/useNarration';
import { NEARBY_MESSAGES, useNearby } from '../../hooks/useNearby';
import { SmartImage } from '../ui';
import { ChevronLeftIcon, ImageIcon, LockIcon, PauseIcon, PlayIcon, ReplayIcon, TextIcon } from '../ui/Icons';
import type { DisplayChapter } from './chapters';
import styles from './spot.module.css';

const SKIP_PREV = 'M6 6h2v12H6zm3.5 6 8.5 6V6z';
const SKIP_NEXT = 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z';

export function AudioPlayer({
  site,
  chapters,
  index,
  onIndexChange,
  onBack,
}: {
  site: HistoricSite;
  chapters: DisplayChapter[];
  index: number;
  onIndexChange: (i: number) => void;
  onBack: () => void;
}) {
  const chapter = chapters[index];
  const [view, setView] = useState<'image' | 'text'>('image');
  const nearby = useNearby(site);
  const locked = chapter.localOnly && !nearby.isNear;
  const narration = useNarration({ text: chapter.text, lang: chapter.lang, soundURL: chapter.soundURL });
  const isEn = chapter.lang === 'en-US';

  return (
    <div className={styles.player}>
      <button type="button" className={styles.back} onClick={onBack}>
        <ChevronLeftIcon size={20} />
        {isEn ? 'Back to chapters' : '音声一覧にもどる'}
      </button>

      <div className={styles.stage}>
        {view === 'image' ? (
          <>
            <SmartImage src={site.photoURL} className={styles.stageImage} />
            <div className={styles.stageInfo}>
              <span className={styles.stageNum}>{String(index + 1).padStart(2, '0')}</span>
              <span className={styles.stageTitle}>{chapter.title}</span>
            </div>
          </>
        ) : (
          <div className={styles.stageText}>{locked ? '' : chapter.text}</div>
        )}
      </div>

      {!locked && (
        <div className={styles.viewToggle}>
          <button type="button" onClick={() => setView(view === 'image' ? 'text' : 'image')}>
            {view === 'image' ? <TextIcon size={16} /> : <ImageIcon size={16} />}
            {view === 'image' ? (isEn ? 'Show text' : 'テキスト表示') : isEn ? 'Show image' : '画像表示'}
          </button>
        </div>
      )}

      {locked ? (
        <div className={styles.lockBox}>
          <div className={styles.lockIcon}>
            <LockIcon size={22} />
          </div>
          <p className={styles.lockMessage}>
            {isEn ? 'This chapter can only be played on site.' : 'この音声は現地でのみお聞きいただけます'}
          </p>
          {nearby.block && <p className={styles.lockHint}>{NEARBY_MESSAGES[nearby.block]}</p>}
        </div>
      ) : (
        <div className={styles.controls}>
          <input
            type="range"
            className={styles.seek}
            min={0}
            max={1000}
            value={Math.round(narration.progress * 1000)}
            onChange={(e) => narration.seek(Number(e.target.value) / 1000)}
            aria-label="再生位置"
          />
          <div className={styles.times}>
            <span>{formatTime(narration.elapsedSec)}</span>
            <span>{formatTime(narration.durationSec)}</span>
          </div>
          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.roundButton}
              aria-label="前の章"
              disabled={index === 0}
              onClick={() => onIndexChange(index - 1)}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d={SKIP_PREV} />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.roundButton} ${styles.playButton}`}
              aria-label={narration.playing ? '一時停止' : '再生'}
              disabled={!narration.supported}
              onClick={narration.toggle}
            >
              {narration.playing ? <PauseIcon size={34} /> : <PlayIcon size={34} />}
            </button>
            <button
              type="button"
              className={styles.roundButton}
              aria-label="次の章"
              disabled={index >= chapters.length - 1}
              onClick={() => onIndexChange(index + 1)}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d={SKIP_NEXT} />
              </svg>
            </button>
          </div>
          <div className={styles.buttons} style={{ marginTop: 0 }}>
            <button type="button" className={styles.roundButton} aria-label="最初から" onClick={narration.restart}>
              <ReplayIcon size={22} />
            </button>
          </div>
          {narration.failed && (
            <p className={styles.unsupported} role="alert">
              音声を再生できませんでした。端末の音量や読み上げ音声の設定をご確認いただくか、テキスト表示でお楽しみください。
            </p>
          )}
          {!narration.supported && (
            <p className={styles.unsupported}>このブラウザは音声の再生（読み上げ）に対応していません。テキスト表示でお楽しみください。</p>
          )}
          <p className={styles.narrator}>
            {chapter.soundURL ? '語り: ガイド音声' : isEn ? 'Narration: text-to-speech' : '語り: 音声読み上げ'}
          </p>
        </div>
      )}
    </div>
  );
}
