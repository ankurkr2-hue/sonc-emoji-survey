import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Special Olympics NC — Event Survey' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
            background: #F4F4F4;
            color: #2D2D2D;
            min-height: 100vh;
          }
          button { font-family: inherit; }
          input, textarea { font-family: inherit; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
