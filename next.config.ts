import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  // Loaded lazily and only where a browser exists (the Render worker or local dev); never bundle it.
  serverExternalPackages: ['playwright', 'playwright-core'],
}

export default nextConfig
