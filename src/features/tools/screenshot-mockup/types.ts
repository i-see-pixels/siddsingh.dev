export type BackgroundStyle = "transparent" | "solid" | "preset" | "custom" | "image"
export type AspectRatioOption = "auto" | "16:9" | "4:3" | "3:4" | "1:1" | "9:16" | "3:2" | "2:3"
export type ShadowPreset = "none" | "soft" | "lifted" | "float" | "custom"
export type BrowserFrameStyle =
	| "none"
	| "macos"
	| "macos-unified"
	| "windows"
	| "browser"
	| "iphone"
export type ExportFormat = "png" | "jpg"
export type StackEffect = "default" | "silhouette"

export type GradientPreset = {
	id: string
	label: string
	start: string
	end: string
	angle: number
}

export type GradientStop = {
	id: string
	position: number
	color: string
	opacity: number
}

export type GradientConfig = {
	direction: number
	stops: GradientStop[]
}

export type ScreenshotMockupState = {
	imageSrc: string | null
	imageName: string
	backgroundStyle: BackgroundStyle
	solidColor: string
	backgroundImageSrc: string | null
	backgroundTintColor: string
	backgroundTintOpacity: number
	backgroundBlur: number
	gradientPresetId: string
	customGradientStart: string
	customGradientEnd: string
	customGradientStops: GradientStop[]
	gradientAngle: number
	aspectRatio: AspectRatioOption
	paddingX: number
	paddingY: number
	cornerRadius: number
	shadowPreset: ShadowPreset
	shadowOffsetX: number
	shadowOffsetY: number
	shadowBlur: number
	shadowOpacity: number
	shadowColor: string
	frameStyle: BrowserFrameStyle
	frameDarkMode: boolean
	address: string
	borderWidth: number
	borderColor: string
	imageScale: number
	rotation: number
	positionX: number
	positionY: number
	flipX: boolean
	flipY: boolean
	rotateX: number
	rotateY: number
	stackEnabled: boolean
	stackCount: number
	stackOffsetX: number
	stackOffsetY: number
	stackScale: number
	stackOpacity: number
	stackBlur: number
	stackEffect: StackEffect
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
			type: "replace"
			state: ScreenshotMockupState
	  }
	| {
			type: "reset"
	  }
