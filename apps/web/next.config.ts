import createMDX from "@next/mdx"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	transpilePackages: ["@workspace/ui"],
	// Blog posts are MDX files in content/blog, imported by app/(site)/blog.
	pageExtensions: ["ts", "tsx", "md", "mdx"],
	images: {
		// Vercel Blob storage carried over from v1 (avatar, project screenshots).
		remotePatterns: [
			{
				protocol: "https",
				hostname: "utxifjblgzbxujxp.public.blob.vercel-storage.com",
				pathname: "/siddsingh_dev/**",
			},
		],
	},
}

export default createMDX()(nextConfig)
