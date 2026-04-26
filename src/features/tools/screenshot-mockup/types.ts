export type BackgroundStyle = "transparent" | "solid" | "preset" | "custom"
export type AspectRatioOption = "auto" | "16:9" | "4:3" | "1:1" | "9:16"
export type ShadowPreset = "none" | "soft" | "lifted" | "float"
export type BrowserFrameStyle = "none" | "light" | "dark" | "minimal" | "iphone"
export type ExportFormat = "png" | "jpg"

export type GradientPreset = {
	id: string
	label: string
	start: string
	end: string
	angle: number
}

export type ScreenshotMockupState = {
	imageSrc: string | null
	imageName: string
	backgroundStyle: BackgroundStyle
	solidColor: string
	gradientPresetId: string
	customGradientStart: string
	customGradientEnd: string
	gradientAngle: number
	aspectRatio: AspectRatioOption
	paddingX: number
	paddingY: number
	cornerRadius: number
	shadowPreset: ShadowPreset
	frameStyle: BrowserFrameStyle
}

export type ScreenshotMockupAction =
	| {
			type: "set-image-source"
			imageSrc: string | null
			imageName: string
	  }
	| {
			type: "patch"
			patch: Partial<ScreenshotMockupState>
	  }
	| {
			type: "reset"
	  }
