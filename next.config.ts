import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  // Loaded lazily and only where a browser exists (the Render worker or local dev); never bundle it.
  serverExternalPackages: ['playwright', 'playwright-core'],
  async redirects() {
    return [
      // The old static demo page: send visitors to the live preview for the sample business.
      {source: '/demo.html', destination: '/demo/rez_13c58a2c2293f1e18c80eaf4', permanent: false},
      {source: '/demo', destination: '/demo/rez_13c58a2c2293f1e18c80eaf4', permanent: false},
    ]
  },
}

export default nextConfig
