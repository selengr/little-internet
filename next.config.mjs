/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      new URL('https://www.artic.edu/**'),
      new URL('https://covers.openlibrary.org/**'),
      new URL('https://images.metmuseum.org/**'),
      new URL('https://i.scdn.co/**'),
      new URL('https://mosaic.scdn.co/**'),
      new URL('https://image-cdn-ak.spotifycdn.com/**'),
      new URL('https://image-cdn-fa.spotifycdn.com/**'),
      new URL('https://images.unsplash.com/**'),
    ],
  },
  async redirects() {
    return [
      // The cat page moved; /dog-facts points at the old combined page until its redesign is ready.
      { source: '/cat', destination: '/cat-facts', permanent: true },
      { source: '/dog-facts', destination: '/animal-facts', permanent: false },
      {
        source: '/desk',
        destination: '/charts',
        permanent: true,
      },
      {
        source: '/desk/:path*',
        destination: '/charts/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ]
  },
}

export default nextConfig
