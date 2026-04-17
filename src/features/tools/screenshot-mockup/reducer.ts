import { createDefaultScreenshotMockupState } from "./constants"
import type { ScreenshotMockupAction, ScreenshotMockupState } from "./types"

export const DEFAULT_SCREENSHOT_MOCKUP_STATE = createDefaultScreenshotMockupState()

export function screenshotMockupReducer(
	state: ScreenshotMockupState,
	action: ScreenshotMockupAction,
) {
	switch (action.type) {
		case "set-image-source":
			return {
				...state,
				imageSrc: action.imageSrc,
				imageName: action.imageName,
			}
		case "patch":
			return {
				...state,
				...action.patch,
			}
		case "reset":
			return createDefaultScreenshotMockupState()
		default:
			return state
	}
}
