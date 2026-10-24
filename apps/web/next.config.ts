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
	// v1 had a page per project under /work/<slug>; v2 lists them all on /work.
	// These keep the old URLs that Google indexed pointing somewhere useful.
	// The first matching rule wins, so the catch-all goes last.
	redirects() {
		return [
			{
				source: "/work/mcp-client-multiserver",
				destination: "/blog/building-a-python-mcp-client-for-multiple-servers",
				permanent: true,
			},
			{ source: "/work/admin-boil-cli", destination: "/products", permanent: true },
			{ source: "/work/plenz", destination: "/products", permanent: true },
			{ source: "/work/:slug", destination: "/work", permanent: true },
		]
	},
}

export default nextConfig
