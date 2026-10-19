import { useNavigate } from 'react-router-dom';
import { Page } from '../components/layout/AppFrame';
import { Button } from '../components/ui';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Page>
      <div style={{ padding: '64px 0', textAlign: 'center' }}>
        <p className="t-heading4">ページが見つかりませんでした</p>
        <p className="t-body-sub c-medium" style={{ marginTop: 8 }}>
          URL が間違っているか、ページが移動した可能性があります。
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
          <Button size="large" onClick={() => navigate('/')}>
            地図へ
          </Button>
          <Button size="large" variant="outlined" onClick={() => navigate('/category')}>
            トップページへ
          </Button>
        </div>
      </div>
    </Page>
  );
}
