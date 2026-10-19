import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Chip } from '../components/ui';
import { AddPhotoIcon, CloseIcon } from '../components/ui/Icons';
import { ERAS, MAX_MOMENT_PHOTOS, MAX_MOMENT_TITLE, PREFECTURES } from '../config';
import { useAuth } from '../hooks/useAuth';
import { useSiteIndex } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import { charLength } from '../lib/format';
import { resizeImage } from '../lib/image';
import styles from '../components/moment/moment.module.css';

interface Picked {
  blob: Blob;
  url: string;
}

async function pick(file: File): Promise<Picked> {
  const blob = await resizeImage(file);
  return { blob, url: URL.createObjectURL(blob) };
}

export default function PostMomentPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const { user, backend } = useAuth();
  const sites = useSiteIndex();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [siteId, setSiteId] = useState(params.get('site') ?? '');
  const [eraTags, setEraTags] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<Picked | null>(null);
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);

  const sortedSites = useMemo(
    () =>
      [...(sites.data ?? [])].sort(
        (a, b) =>
          PREFECTURES.indexOf(a.prefecture as never) - PREFECTURES.indexOf(b.prefecture as never) || a.kana.localeCompare(b.kana, 'ja'),
      ),
    [sites.data],
  );

  // 関連する史跡を選んだら、その史跡の時代タグを提案
  useEffect(() => {
    const site = sites.data?.find((s) => s.id === siteId);
    if (site && eraTags.length === 0) setEraTags(site.eras.filter((e) => (ERAS as readonly string[]).includes(e)));
    // eraTags は初回提案のみに使う
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, sites.data]);

  useEffect(
    () => () => {
      if (thumbnail) URL.revokeObjectURL(thumbnail.url);
      photos.forEach((p) => URL.revokeObjectURL(p.url));
    },
    // ページを離れるときだけ解放
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onThumb = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setThumbnail(await pick(file));
    } catch {
      toast('画像の読み込みに失敗しました', 'error');
    }
  };

  const onPhotos = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const room = MAX_MOMENT_PHOTOS - photos.length;
    if (files.length > room) toast(`写真は${MAX_MOMENT_PHOTOS}枚まで追加できます。`);
    try {
      const picked = await Promise.all(files.slice(0, room).map(pick));
      setPhotos((prev) => [...prev, ...picked]);
    } catch {
      toast('画像の読み込みに失敗しました', 'error');
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = {
      title: !title.trim()
        ? 'タイトルを入力してください'
        : charLength(title) > MAX_MOMENT_TITLE
          ? `${MAX_MOMENT_TITLE}字以内で入力してください`
          : undefined,
      text: !text.trim() ? 'テキストを入力してください' : undefined,
    };
    setErrors(next);
    if (next.title || next.text || !user || !backend) return;
    setSubmitting(true);
    try {
      const moment = await backend.addMoment(user.uid, {
        title: title.trim(),
        text: text.trim(),
        eraTags,
        siteId: siteId || undefined,
        thumbnail: thumbnail?.blob,
        photos: photos.map((p) => p.blob),
      });
      await queryClient.invalidateQueries({ queryKey: ['moments'] });
      toast('投稿が完了しました！', 'success');
      navigate(`/show-moment/${moment.id}`, { replace: true });
    } catch {
      toast('投稿に失敗しました。もう一度お試しください。', 'error');
      setSubmitting(false);
    }
  };

  const titleLen = charLength(title);

  return (
    <main style={{ padding: '0 16px' }}>
      <h1 className="t-heading1" style={{ margin: '16px 0 20px' }}>
        探訪記を書く
      </h1>
      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.field}>
          <span className={styles.label}>
            サムネイル <span className={styles.optional}>(任意)</span>
          </span>
          <label className={styles.thumbPicker}>
            {thumbnail ? <img src={thumbnail.url} alt="選択したサムネイル" /> : <AddPhotoIcon size={32} />}
            {!thumbnail && <span>画像を選択</span>}
            <input type="file" accept="image/*" className={styles.fileInput} onChange={onThumb} />
          </label>
          {thumbnail && (
            <Button variant="text" onClick={() => setThumbnail(null)} style={{ alignSelf: 'flex-end' }}>
              サムネイルを外す
            </Button>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="title">
            探訪記タイトル <span className={styles.optional}>({MAX_MOMENT_TITLE}字以内)</span>{' '}
            <span className={styles.required}>*必須</span>
          </label>
          <input
            id="title"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトルを入力"
          />
          <span className={`${styles.counter} ${titleLen > MAX_MOMENT_TITLE ? styles.counterOver : ''}`}>
            {titleLen}/{MAX_MOMENT_TITLE}
          </span>
          {errors.title && <p className={styles.error}>{errors.title}</p>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="site">
            訪れた史跡 <span className={styles.optional}>(任意)</span>
          </label>
          <select id="site" className={styles.select} value={siteId} onChange={(e) => setSiteId(e.target.value)}>
            <option value="">選択しない</option>
            {sortedSites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.prefecture} / {s.title}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="text">
            テキスト <span className={styles.required}>*必須</span>
          </label>
          <textarea
            id="text"
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="行った史跡の感想や口コミを書いてみよう。"
          />
          {errors.text && <p className={styles.error}>{errors.text}</p>}
        </div>

        <div className={styles.field}>
          <span className={styles.label}>
            写真を追加 <span className={styles.optional}>(任意)</span>
          </span>
          <span className={styles.hint}>写真は{MAX_MOMENT_PHOTOS}枚まで追加できます。</span>
          <div className={styles.photos}>
            {photos.map((p, i) => (
              <div key={p.url} className={styles.photoItem}>
                <img src={p.url} alt={`写真 ${i + 1}`} />
                <button
                  type="button"
                  className={styles.photoRemove}
                  aria-label={`写真 ${i + 1} を削除`}
                  onClick={() => {
                    URL.revokeObjectURL(p.url);
                    setPhotos((prev) => prev.filter((x) => x !== p));
                  }}
                >
                  <CloseIcon size={16} />
                </button>
              </div>
            ))}
            {photos.length < MAX_MOMENT_PHOTOS && (
              <label className={styles.photoAdd}>
                <AddPhotoIcon size={28} />
                写真を追加
                <input type="file" accept="image/*" multiple className={styles.fileInput} onChange={onPhotos} />
              </label>
            )}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>
            タグ <span className={styles.optional}>(任意)</span>
          </span>
          <span className={styles.hint}>追加したい時代タグを選択してください。</span>
          <div className={styles.tags}>
            {ERAS.map((era) => (
              <Chip
                key={era}
                active={eraTags.includes(era)}
                onClick={() => setEraTags((prev) => (prev.includes(era) ? prev.filter((x) => x !== era) : [...prev, era]))}
              >
                {era}
              </Chip>
            ))}
          </div>
        </div>

        <Button type="submit" size="large" fullWidth loading={submitting}>
          投稿する
        </Button>
      </form>
    </main>
  );
}
