'use client';

import { useEffect } from 'react';
import Layout from './components/Layout';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
        <h1 style={{ fontSize: '48px', margin: 0, color: '#ef4444' }}>Error</h1>
        <h2 style={{ fontSize: '24px', marginTop: '16px' }}>Something went wrong!</h2>
        <p style={{ marginTop: '8px', color: '#666', textAlign: 'center' }}>
          {error?.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            background: '#008bc1',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    </Layout>
  );
}
