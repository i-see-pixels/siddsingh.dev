import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	transpilePackages: ["@workspace/ui", "@workspace/db"],
	images: {
		// Vercel Blob storage carried over from v1 (avatar, project screenshots, blog uploads).
		remotePatterns: [
			{
				protocol: "https",
				hostname: "utxifjblgzbxujxp.public.blob.vercel-storage.com",
				pathname: "/siddsingh_dev/**",
			},
		],
	},
}

export default nextConfig
