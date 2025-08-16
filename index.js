import { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/globals.css';

export default function Home() {
  const [url, setUrl] = useState('');
  const [proxiedContent, setProxiedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) {
      setError('Please enter a URL.');
      return;
    }
    setIsLoading(true);
    setError('');
    setProxiedContent('');

    try {
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch the page. Status: ${response.status}`);
      }
      const data = await response.json();
      setProxiedContent(data.html);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Guardian Web Proxy</title>
        <meta name="description" content="A privacy-first web proxy" />
      </Head>

      <header className="header">
        <svg className="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V13H5V6.3l7-3.11v9.8z"></path></svg>
        <h1>Guardian Web Proxy</h1>
      </header>

      <form onSubmit={handleSubmit} className="url-form">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="url-input"
        />
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Go'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      <div className="content-frame">
        {proxiedContent && (
          <iframe
            srcDoc={proxiedContent}
            sandbox="allow-scripts allow-same-origin"
            title="Proxied Content"
          />
        )}
      </div>
    </div>
  );
}