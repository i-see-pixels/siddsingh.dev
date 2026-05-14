import type {
	AspectRatioOption,
	BrowserFrameStyle,
	GradientPreset,
	ScreenshotMockupState,
	ShadowPreset,
} from "./types"

export const DEMO_IMAGE = {
	src: "/images/blog/mcp-client.png",
	name: "Demo screenshot",
}

export const gradientPresets: GradientPreset[] = [
	{
		id: "pastel",
		label: "Pastel",
		start: "#a8edea",
		end: "#fed6e3",
		angle: 135,
	},
	{
		id: "sunrise",
		label: "Sunrise",
		start: "#ff9a9e",
		end: "#fad0c4",
		angle: 135,
	},
	{
		id: "lavender",
		label: "Lavender",
		start: "#e0c3fc",
		end: "#8ec5fc",
		angle: 135,
	},
	{
		id: "mint",
		label: "Mint",
		start: "#a8ff78",
		end: "#78ffd6",
		angle: 135,
	},
	{ id: "pink", label: "Pink", start: "#f093fb", end: "#f5576c", angle: 135 },
	{ id: "purple", label: "Purple", start: "#c471f5", end: "#fa71cd", angle: 135 },
	{ id: "indigo", label: "Indigo", start: "#667eea", end: "#764ba2", angle: 135 },
	{ id: "sea", label: "Sea", start: "#2E3192", end: "#1BFFFF", angle: 135 },
	{ id: "forest", label: "Forest", start: "#0ba360", end: "#3cba92", angle: 135 },
	{ id: "dark-pink", label: "Dark Pink", start: "#b04b66", end: "#6b2037", angle: 135 },
	{ id: "maroon", label: "Maroon", start: "#68294c", end: "#3a0f28", angle: 135 },
	{ id: "deep-indigo", label: "Deep Indigo", start: "#444a7a", end: "#212449", angle: 135 },
	{ id: "midnight-sea", label: "Midnight Sea", start: "#2d2a75", end: "#101c2e", angle: 135 },
	{ id: "forest-shadow", label: "Forest Shadow", start: "#116436", end: "#023015", angle: 135 },
]

export const aspectRatioOptions: Array<{
	value: AspectRatioOption
	label: string
}> = [
	{ value: "auto", label: "Auto" },
	{ value: "16:9", label: "16:9" },
	{ value: "4:3", label: "4:3" },
	{ value: "3:4", label: "3:4" },
	{ value: "1:1", label: "1:1" },
	{ value: "9:16", label: "9:16" },
	{ value: "3:2", label: "3:2" },
	{ value: "2:3", label: "2:3" },
]

export const frameStyleOptions: Array<{
	value: BrowserFrameStyle
	label: string
}> = [
	{ value: "macos", label: "macOS" },
	{ value: "macos-unified", label: "macOS Unified" },
	{ value: "windows", label: "Windows 11" },
	{ value: "browser", label: "Browser" },
	{ value: "iphone", label: "iPhone" },
	{ value: "none", label: "None" },
]

export const shadowOptions: Array<{ value: ShadowPreset; label: string }> = [
	{ value: "soft", label: "Soft" },
	{ value: "lifted", label: "Lifted" },
	{ value: "float", label: "Float" },
	{ value: "custom", label: "Custom" },
	{ value: "none", label: "None" },
]

export const backgroundOptions = [
	{ value: "preset", label: "Preset gradient" },
	{ value: "custom", label: "Custom gradient" },
	{ value: "image", label: "Image" },
	{ value: "solid", label: "Solid color" },
	{ value: "transparent", label: "Transparent PNG" },
] as const

export function createDefaultScreenshotMockupState(): ScreenshotMockupState {
	return {
		imageSrc: DEMO_IMAGE.src,
		imageName: DEMO_IMAGE.name,
		backgroundStyle: "preset",
		solidColor: "#f5f5f5",
		backgroundImageSrc: null,
		backgroundTintColor: "#000000",
		backgroundTintOpacity: 0,
		backgroundBlur: 0,
		gradientPresetId: gradientPresets[0].id,
		customGradientStart: "#a8edea",
		customGradientEnd: "#fed6e3",
		customGradientStops: [
			{ id: "custom-gradient-start", position: 0, color: "#a8edea", opacity: 100 },
			{ id: "custom-gradient-end", position: 100, color: "#fed6e3", opacity: 100 },
		],
		gradientAngle: 135,
		aspectRatio: "auto",
		paddingX: 80,
		paddingY: 60,
		cornerRadius: 12,
		shadowPreset: "soft",
		shadowOffsetX: 0,
		shadowOffsetY: 20,
		shadowBlur: 40,
		shadowOpacity: 30,
		shadowColor: "#000000",
		frameStyle: "none",
		frameDarkMode: true,
		address: "https://siddsingh.dev/tools/screenshot-mockup",
		borderWidth: 0,
		borderColor: "#ffffff",
		imageScale: 100,
		rotation: 0,
		positionX: 0,
		positionY: 0,
		flipX: false,
		flipY: false,
		rotateX: 0,
		rotateY: 0,
		stackEnabled: false,
		stackCount: 3,
		stackOffsetX: 0,
		stackOffsetY: -10,
		stackScale: 95,
		stackOpacity: 50,
		stackBlur: 0,
		stackEffect: "default",
	}
}
