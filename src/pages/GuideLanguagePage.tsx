import { Page } from '../components/layout/AppFrame';
import { useSettings, type GuideLanguage } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import styles from './pages.module.css';

const OPTIONS: { value: GuideLanguage; label: string }[] = [
  { value: 'ja', label: '日本語' },
  { value: 'en', label: 'English' },
];

export default function GuideLanguagePage() {
  const { guideLanguage, setGuideLanguage } = useSettings();
  const toast = useToast();
  return (
    <Page title="ガイド音声言語" center>
      <div role="radiogroup" aria-label="ガイド音声言語">
        {OPTIONS.map((o) => (
          <label key={o.value} className={styles.radio}>
            {o.label}
            <input
              type="radio"
              name="lang"
              checked={guideLanguage === o.value}
              onChange={() => {
                setGuideLanguage(o.value);
                toast('言語設定を変更しました');
              }}
            />
          </label>
        ))}
      </div>
    </Page>
  );
}
