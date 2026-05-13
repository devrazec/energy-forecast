'use client';

import Layout from './components/Layout';

export default function NotFound() {
  return (
    <Layout>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '24px',
        }}
      >
        <h1 style={{ fontSize: '72px', margin: 0, color: '#008bc1' }}>404</h1>
        <h2 style={{ fontSize: '24px', marginTop: '16px' }}>Page Not Found</h2>
        <p style={{ marginTop: '8px', color: '#666' }}>
          The page you are looking for does not exist.
        </p>
        <a
          href="/"
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            background: '#008bc1',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 600,
          }}
        >
          Go Home
        </a>
      </div>
    </Layout>
  );
}
