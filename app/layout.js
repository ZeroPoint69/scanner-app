import './globals.css';

export const metadata = {
  title: 'Scanner App',
  description: 'Scan 2 codes and export',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}