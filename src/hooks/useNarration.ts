import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type NarrationLang = 'ja-JP' | 'en-US';

interface Options {
  text: string;
  lang: NarrationLang;
  /** 録音音声の URL。あればこちらを再生し、無ければ音声合成で読み上げます */
  soundURL?: string;
  rate?: number;
}

export interface Narration {
  supported: boolean;
  playing: boolean;
  /** 再生に失敗した（端末に音声が無いなど） */
  failed: boolean;
  /** 0〜1 */
  progress: number;
  elapsedSec: number;
  durationSec: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (fraction: number) => void;
  restart: () => void;
}

/** 文単位に分割（音声合成は長い文を途中で止めてしまうブラウザがあるため） */
export function splitSentences(text: string): string[] {
  const parts = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[。！？!?])|(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text];
}

/** 1 秒あたりに読む文字数の目安（再生時間の表示に使う） */
function charsPerSecond(lang: NarrationLang, rate: number) {
  return (lang === 'ja-JP' ? 7.5 : 14) * rate;
}

let cachedVoices: SpeechSynthesisVoice[] = [];
function pickVoice(lang: NarrationLang): SpeechSynthesisVoice | undefined {
  if (typeof speechSynthesis === 'undefined') return undefined;
  if (cachedVoices.length === 0) cachedVoices = speechSynthesis.getVoices();
  const prefix = lang.slice(0, 2);
  const candidates = cachedVoices.filter((v) => v.lang.replace('_', '-').startsWith(prefix));
  return (
    candidates.find((v) => v.lang.replace('_', '-') === lang && /Google|Kyoko|O-Ren|Siri|Natural/i.test(v.name)) ??
    candidates.find((v) => v.lang.replace('_', '-') === lang) ??
    candidates[0]
  );
}

if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoices = speechSynthesis.getVoices();
  });
}

export function useNarration({ text, lang, soundURL, rate = 1 }: Options): Narration {
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const sentences = useMemo(() => splitSentences(text), [text]);
  const offsets = useMemo(() => {
    const out: number[] = [];
    let acc = 0;
    for (const s of sentences) {
      out.push(acc);
      acc += s.length;
    }
    return out;
  }, [sentences]);
  const totalChars = useMemo(() => sentences.reduce((n, s) => n + s.length, 0), [sentences]);

  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sentenceIdx = useRef(0);
  const sentenceStartedAt = useRef(0);
  const timer = useRef<number | null>(null);
  const token = useRef(0);

  const cps = charsPerSecond(lang, rate);
  const durationSec = soundURL ? audioDuration : totalChars / cps;

  const stopTimer = () => {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
  };

  const stopAll = useCallback(() => {
    token.current++;
    stopTimer();
    if (ttsSupported) speechSynthesis.cancel();
    audioRef.current?.pause();
  }, [ttsSupported]);

  // 録音音声
  useEffect(() => {
    if (!soundURL) return;
    const audio = new Audio(soundURL);
    audio.preload = 'metadata';
    audioRef.current = audio;
    const onTime = () => audio.duration && setProgress(audio.currentTime / audio.duration);
    const onMeta = () => setAudioDuration(audio.duration || 0);
    const onEnd = () => setPlaying(false);
    const onError = () => {
      setPlaying(false);
      setFailed(true);
    };
    audio.addEventListener('error', onError);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
    };
  }, [soundURL]);

  // テキストが変わったら止めて最初から
  useEffect(() => {
    stopAll();
    setPlaying(false);
    setFailed(false);
    setProgress(0);
    sentenceIdx.current = 0;
    return stopAll;
  }, [text, lang, soundURL, stopAll]);

  const speakFrom = useCallback(
    (idx: number) => {
      if (!ttsSupported) return;
      const my = ++token.current;
      speechSynthesis.cancel();
      stopTimer();
      if (idx >= sentences.length) {
        setPlaying(false);
        setProgress(1);
        sentenceIdx.current = 0;
        return;
      }
      sentenceIdx.current = idx;
      const sentence = sentences[idx];
      const u = new SpeechSynthesisUtterance(sentence);
      u.lang = lang;
      u.rate = rate;
      const voice = pickVoice(lang);
      if (voice) u.voice = voice;
      u.onstart = () => {
        if (my !== token.current) return;
        sentenceStartedAt.current = performance.now();
        stopTimer();
        timer.current = window.setInterval(() => {
          const elapsed = (performance.now() - sentenceStartedAt.current) / 1000;
          const chars = Math.min(sentence.length, elapsed * cps);
          setProgress((offsets[idx] + chars) / totalChars);
        }, 200);
      };
      u.onend = () => {
        if (my !== token.current) return;
        stopTimer();
        setProgress((offsets[idx] + sentence.length) / totalChars);
        speakFrom(idx + 1);
      };
      u.onerror = (e) => {
        if (my !== token.current) return;
        stopTimer();
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          setPlaying(false);
          setFailed(true);
        }
      };
      speechSynthesis.speak(u);
      setProgress(offsets[idx] / totalChars);
    },
    [ttsSupported, sentences, lang, rate, cps, offsets, totalChars],
  );

  const play = useCallback(() => {
    if (soundURL) {
      setFailed(false);
      void audioRef.current?.play().then(
        () => setPlaying(true),
        () => {
          setPlaying(false);
          setFailed(true);
        },
      );
      return;
    }
    if (!ttsSupported) return;
    setFailed(false);
    setPlaying(true);
    const idx = progress >= 0.999 ? 0 : sentenceIdx.current;
    speakFrom(idx);
  }, [soundURL, ttsSupported, progress, speakFrom]);

  const pause = useCallback(() => {
    stopAll();
    setPlaying(false);
    // 文の途中で止めた場合は、その文の頭から再開する
    if (!soundURL) setProgress(offsets[sentenceIdx.current] / totalChars);
  }, [stopAll, soundURL, offsets, totalChars]);

  const seek = useCallback(
    (fraction: number) => {
      const f = Math.max(0, Math.min(1, fraction));
      if (soundURL) {
        const a = audioRef.current;
        if (a && a.duration) a.currentTime = f * a.duration;
        setProgress(f);
        return;
      }
      const targetChar = f * totalChars;
      let idx = offsets.findIndex((o, i) => targetChar >= o && targetChar < o + sentences[i].length);
      if (idx < 0) idx = sentences.length - 1;
      sentenceIdx.current = idx;
      setProgress(offsets[idx] / totalChars);
      if (playing) speakFrom(idx);
    },
    [soundURL, totalChars, offsets, sentences, playing, speakFrom],
  );

  const restart = useCallback(() => {
    sentenceIdx.current = 0;
    setProgress(0);
    if (soundURL && audioRef.current) audioRef.current.currentTime = 0;
    if (playing) {
      if (soundURL) void audioRef.current?.play();
      else speakFrom(0);
    }
  }, [soundURL, playing, speakFrom]);

  return {
    supported: Boolean(soundURL) || ttsSupported,
    playing,
    failed,
    progress,
    elapsedSec: progress * durationSec,
    durationSec,
    play,
    pause,
    toggle: () => (playing ? pause() : play()),
    seek,
    restart,
  };
}

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
