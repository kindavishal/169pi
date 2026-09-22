import './globals.css';

export const metadata = {
  title: 'Get ready for Hacktoberfest with 169Pi',
  description:
    'Preptember — the warm-up to Hacktoberfest. Make your first open-source contribution to 169Pi\'s Alpie-Core, the easy way.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
