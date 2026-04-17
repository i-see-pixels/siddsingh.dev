import type {
	AspectRatioOption,
	BrowserFrameStyle,
	GradientPreset,
	ScreenshotMockupState,
	ShadowPreset,
} from "./types"

export const DEMO_IMAGE = {
	src: "/images/projects/project-01/cover-01.jpg",
	name: "Demo screenshot",
}

export const gradientPresets: GradientPreset[] = [
	{
		id: "electric-ocean",
		label: "Electric Ocean",
		start: "#0f172a",
		end: "#22d3ee",
		angle: 135,
	},
	{
		id: "sunset-burst",
		label: "Sunset Burst",
		start: "#7c2d12",
		end: "#fb7185",
		angle: 125,
	},
	{
		id: "aurora",
		label: "Aurora",
		start: "#1d4ed8",
		end: "#34d399",
		angle: 145,
	},
	{
		id: "violet-night",
		label: "Violet Night",
		start: "#111827",
		end: "#7c3aed",
		angle: 135,
	},
]

export const aspectRatioOptions: Array<{ value: AspectRatioOption; label: string }> = [
	{ value: "auto", label: "Auto" },
	{ value: "16:9", label: "16:9" },
	{ value: "4:3", label: "4:3" },
	{ value: "1:1", label: "1:1" },
]

export const frameStyleOptions: Array<{ value: BrowserFrameStyle; label: string }> = [
	{ value: "dark", label: "Dark" },
	{ value: "light", label: "Light" },
	{ value: "minimal", label: "Minimal" },
	{ value: "none", label: "None" },
]

export const shadowOptions: Array<{ value: ShadowPreset; label: string }> = [
	{ value: "soft", label: "Soft" },
	{ value: "lifted", label: "Lifted" },
	{ value: "float", label: "Float" },
	{ value: "none", label: "None" },
]

export const backgroundOptions = [
	{ value: "preset", label: "Preset gradient" },
	{ value: "custom", label: "Custom gradient" },
	{ value: "solid", label: "Solid color" },
	{ value: "transparent", label: "Transparent PNG" },
] as const

export function createDefaultScreenshotMockupState(): ScreenshotMockupState {
	return {
		imageSrc: DEMO_IMAGE.src,
		imageName: DEMO_IMAGE.name,
		backgroundStyle: "preset",
		solidColor: "#111827",
		gradientPresetId: gradientPresets[0].id,
		customGradientStart: "#111827",
		customGradientEnd: "#2563eb",
		gradientAngle: 135,
		aspectRatio: "16:9",
		paddingX: 96,
		paddingY: 72,
		cornerRadius: 28,
		shadowPreset: "soft",
		frameStyle: "dark",
	}
}
