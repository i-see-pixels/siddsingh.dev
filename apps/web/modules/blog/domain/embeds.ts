// Turns a pasted link into an embeddable player. A post embeds something by
// putting its URL on a line of its own; the iframe address is always rebuilt
// here from a validated id, never taken from the post, so only these providers
// can ever be framed. Add a provider by adding an entry to `providers`.

export type Embed = {
	provider: string
	src: string
	title: string
	/** CSS aspect-ratio for players that scale, e.g. "16 / 9". */
	aspectRatio?: string
	/** Fixed height in pixels for players that don't. */
	height?: number
}

type Provider = {
	name: string
	resolve(url: URL): Omit<Embed, "provider"> | null
}

const host = (url: URL) => url.hostname.replace(/^(www|m)\./, "")

/** YouTube's "t" parameter: "90", "90s" or "1h2m30s" → seconds. */
function parseStart(value: string | null) {
	if (!value) return 0
	if (/^\d+s?$/.test(value)) return Number.parseInt(value, 10)
	const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
	if (!match) return 0
	const [, h = "0", m = "0", s = "0"] = match
	return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

const youtube: Provider = {
	name: "YouTube",
	resolve(url) {
		let id: string | null | undefined = null
		if (host(url) === "youtu.be") id = url.pathname.slice(1)
		else if (host(url) === "youtube.com" || host(url) === "youtube-nocookie.com")
			id =
				url.pathname === "/watch"
					? url.searchParams.get("v")
					: url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1]
		if (!id || !/^[\w-]{11}$/.test(id)) return null

		// The no-cookie domain sets no tracking cookies until the reader presses play.
		const src = new URL(`https://www.youtube-nocookie.com/embed/${id}`)
		const start = parseStart(url.searchParams.get("t") ?? url.searchParams.get("start"))
		if (start) src.searchParams.set("start", String(start))
		const short = url.pathname.startsWith("/shorts/")
		return { src: src.href, title: "YouTube video", aspectRatio: short ? "9 / 16" : "16 / 9" }
	},
}

const vimeo: Provider = {
	name: "Vimeo",
	resolve(url) {
		const id = host(url) === "vimeo.com" && url.pathname.match(/^\/(\d+)\/?$/)?.[1]
		return id
			? {
					src: `https://player.vimeo.com/video/${id}`,
					title: "Vimeo video",
					aspectRatio: "16 / 9",
				}
			: null
	},
}

const loom: Provider = {
	name: "Loom",
	resolve(url) {
		const id =
			host(url) === "loom.com" && url.pathname.match(/^\/share\/([0-9a-f]{32})\/?$/)?.[1]
		return id
			? {
					src: `https://www.loom.com/embed/${id}`,
					title: "Loom video",
					aspectRatio: "16 / 9",
				}
			: null
	},
}

const codepen: Provider = {
	name: "CodePen",
	resolve(url) {
		const match =
			host(url) === "codepen.io" && url.pathname.match(/^\/([\w-]+)\/pen\/(\w+)\/?$/)
		if (!match) return null
		return {
			src: `https://codepen.io/${match[1]}/embed/${match[2]}?default-tab=result`,
			title: "CodePen demo",
			height: 420,
		}
	},
}

const codesandbox: Provider = {
	name: "CodeSandbox",
	resolve(url) {
		const id =
			host(url) === "codesandbox.io" &&
			url.pathname.match(/^\/(?:s|p\/sandbox|p\/devbox)\/(?:[\w-]+-)?(\w+)\/?$/)?.[1]
		return id
			? { src: `https://codesandbox.io/embed/${id}`, title: "CodeSandbox", height: 500 }
			: null
	},
}

const spotify: Provider = {
	name: "Spotify",
	resolve(url) {
		const match =
			host(url) === "open.spotify.com" &&
			url.pathname.match(
				/^\/(?:intl-[a-z-]+\/)?(track|episode|album|playlist|show)\/([0-9A-Za-z]{22})\/?$/,
			)
		if (!match) return null
		const [, type, id] = match
		const compact = type === "track" || type === "episode"
		return {
			src: `https://open.spotify.com/embed/${type}/${id}`,
			title: `Spotify ${type}`,
			height: compact ? 152 : 352,
		}
	},
}

const providers: Provider[] = [youtube, vimeo, loom, codepen, codesandbox, spotify]

export const EMBED_PROVIDERS = providers.map((provider) => provider.name)

/** The embed for a URL, or null when it isn't from a supported provider. */
export function resolveEmbed(href: string): Embed | null {
	if (!URL.canParse(href)) return null
	const url = new URL(href)
	if (url.protocol !== "https:" && url.protocol !== "http:") return null
	for (const provider of providers) {
		const embed = provider.resolve(url)
		if (embed) return { provider: provider.name, ...embed }
	}
	return null
}
