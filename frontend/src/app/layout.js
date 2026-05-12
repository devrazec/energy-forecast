import './globals.css';
import { GlobalProvider } from './context/GlobalContext';
import Providers from './providers';

export const metadata = {
  title: 'ENERGY',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <GlobalProvider>
          <Providers>
            {children}
          </Providers>
        </GlobalProvider>
      </body>
    </html>
  );
}
