import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CentrumRolnictwa.pl - Części i Maszyny',
    short_name: 'CentrumRolnictwa',
    description: 'Najlepszy sklep rolniczy. Zamawiaj części do traktorów prosto z pola.',
    start_url: '/',
    display: 'standalone', // Uruchamia tryb pełnoekranowy jak w natywnej aplikacji
    background_color: '#f8fafc', // slate-50
    theme_color: '#0f172a', // slate-900 (pasek powiadomień w telefonie dopasuje się do tego koloru)
    orientation: 'portrait',
    icons: [
      // Zadbaj, aby wrzucić do folderu /public te dwie ikonki! (Rozmiary 192x192 i 512x512)
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
    ],
  };
}