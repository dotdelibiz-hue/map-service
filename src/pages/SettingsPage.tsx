import { Link } from 'react-router-dom';
import { Page } from '../components/layout/AppFrame';
import { Switch } from '../components/ui';
import { ChevronRightIcon } from '../components/ui/Icons';
import { NEARBY_RADIUS_M } from '../config';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import styles from './pages.module.css';

export default function SettingsPage() {
  const { guideLanguage, kidsMode, setKidsMode, skipLocationCheck, setSkipLocationCheck } = useSettings();
  const { backend } = useAuth();
  const toast = useToast();

  return (
    <Page title="設定" center>
      <ul className={styles.settingsList}>
        <li>
          <Link to="/settings/guide-language" className={styles.settingsItem}>
            <div>
              <div className={styles.settingsLabel}>ガイド音声言語</div>
              <div className={styles.settingsValue}>{guideLanguage === 'en' ? 'English' : '日本語'}</div>
            </div>
            <ChevronRightIcon size={28} color="#555" />
          </Link>
        </li>
        <li>
          <div className={styles.settingsItem}>
            <div>
              <div className={styles.settingsLabel}>こども向けガイド</div>
              <div className={styles.settingsNote}>やさしいことばの説明と音声ガイドに切り替えます</div>
            </div>
            <Switch
              checked={kidsMode}
              label="こども向けガイド"
              onChange={(v) => {
                setKidsMode(v);
                toast(v ? 'こども向けガイドモードになりました' : 'こども向けガイドモードを終了しました');
              }}
            />
          </div>
        </li>
        {backend?.mode === 'local' && (
          <li>
            <div className={styles.settingsItem}>
              <div>
                <div className={styles.settingsLabel}>現地判定をスキップ（デモ用）</div>
                <div className={styles.settingsNote}>
                  オンにすると、史跡から{NEARBY_RADIUS_M}m 以上離れていても「訪問済みにする」や現地限定の音声を試せます。
                </div>
              </div>
              <Switch checked={skipLocationCheck} label="現地判定をスキップ" onChange={setSkipLocationCheck} />
            </div>
          </li>
        )}
      </ul>
    </Page>
  );
}
