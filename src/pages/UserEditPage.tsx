import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, PageSpinner } from '../components/ui';
import { AddPhotoIcon } from '../components/ui/Icons';
import { MAX_BIO } from '../config';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import { charLength } from '../lib/format';
import { resizeImage } from '../lib/image';
import styles from './user.module.css';

export default function UserEditPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user, backend } = useAuth();
  const profile = useProfile(userId);
  const [name, setName] = useState('');
  const [userName, setUserName] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile.data) return;
    setName(profile.data.name);
    setUserName(profile.data.userName);
    setBio(profile.data.bio);
  }, [profile.data]);

  if (user && user.uid !== userId) return <Navigate to={`/user/${userId}`} replace />;
  if (profile.isLoading) return <PageSpinner />;

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const blob = await resizeImage(file, 512);
      setPhoto({ blob, url: URL.createObjectURL(blob) });
      toast('画像が選択されました');
    } catch {
      toast('画像の読み込みに失敗しました', 'error');
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (charLength(bio) > MAX_BIO) {
      setError(`自己紹介は${MAX_BIO}文字以内で入力してください`);
      return;
    }
    if (userName && !/^[A-Za-z0-9_]{1,20}$/.test(userName)) {
      setError('ユーザー名は半角英数字とアンダーバー（20文字以内）で入力してください');
      return;
    }
    if (!user || !backend) return;
    setError(undefined);
    setSaving(true);
    try {
      await backend.updateProfile(user.uid, { name: name.trim(), userName: userName.trim(), bio: bio.trim(), photo: photo?.blob });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast('更新しました', 'success');
      navigate(`/user/${user.uid}`);
    } catch {
      toast('更新に失敗しました', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ padding: '0 16px' }}>
      <h1 className="t-heading1" style={{ margin: '16px 0 8px' }}>
        プロフィール編集
      </h1>
      <form className={styles.form} onSubmit={submit} noValidate>
        <label className={styles.avatarPicker} aria-label="プロフィール画像を選択">
          <Avatar src={photo?.url ?? profile.data?.photoURL} size={96} />
          <span className={styles.avatarBadge}>
            <AddPhotoIcon size={16} />
          </span>
          <input type="file" accept="image/*" onChange={onPhoto} style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
        </label>
        <h2 className={styles.sectionTitle}>基本情報</h2>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            名前
          </label>
          <input
            id="name"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder="表示される名前"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="userName">
            ユーザー名
          </label>
          <input
            id="userName"
            className={styles.input}
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            maxLength={20}
            placeholder="半角英数字（例: rekitabi_taro）"
            autoCapitalize="off"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="bio">
            自己紹介({MAX_BIO}文字以内)
          </label>
          <input id="bio" className={styles.input} value={bio} onChange={(e) => setBio(e.target.value)} />
          <span className={styles.counter}>
            {charLength(bio)}/{MAX_BIO}
          </span>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <Button type="submit" size="large" fullWidth loading={saving}>
          更新する
        </Button>
      </form>
    </main>
  );
}
