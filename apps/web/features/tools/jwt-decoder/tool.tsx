"use client"

import { Button } from "@workspace/ui/components/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import {
	CheckIcon,
	ChevronRightIcon,
	EraserIcon,
	KeyRoundIcon,
	Link2Icon,
	LockKeyholeIcon,
	ScissorsIcon,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { ResizableSplit } from "@/components/resizable-split"
import { CodeEditor } from "../editor/code-editor"
import { json } from "../editor/languages/json"
import { jwt } from "../editor/languages/jwt"
import type { InlineMark } from "../editor/marks"
import { bytesToBase64Url, fragmentLink, readFragment, toBase64Url } from "../share"
import {
	Chip,
	ErrorCard,
	FileTab,
	headerButton,
	PaneHeader,
	StatusBar,
	SubBar,
	ToggleChip,
} from "../tool-chrome"
import { CopyButton } from "../tool-ui"
import { audit, maskPaths, pathKey, pathLabel, sensitivePaths, type WeakSecretState } from "./audit"
import { decodeToken, type Segment } from "./decode"
import { AuditPanel, ClaimsPanel, ExpiryCountdown } from "./panels"
import { algorithmFamily, isHmac, type VerifyResult, verifySignature } from "./verify"
import type { WorkerReply, WorkerRequest } from "./worker"

const WORKSPACE = "/tools/jwt-decoder/workspace"
type Tab = "audit" | "claims" | "header" | "payload"

/** A fresh HS256 sample, signed with a random 32-byte secret so it passes the audit. */
async function makeSample() {
	const now = Math.floor(Date.now() / 1000)
	const header = { alg: "HS256", typ: "JWT", kid: "2026-10-key" }
	const payload = {
		iss: "https://auth.example.com",
		sub: "user_8f2c41",
		aud: "api.example.com",
		iat: now,
		nbf: now,
		exp: now + 3600,
		scope: "read:orders write:orders",
		jti: crypto.randomUUID(),
	}
	const secret = crypto.getRandomValues(new Uint8Array(32))
	const input = `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(payload))}`
	const key = await crypto.subtle.importKey(
		"raw",
		secret,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	)
	const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input))
	return {
		token: `${input}.${bytesToBase64Url(new Uint8Array(signature))}`,
		secret: btoa(String.fromCharCode(...secret)),
	}
}

function readInitial() {
	const shared = readFragment(window.location.hash).get("token")
	return shared ? { text: shared, shared: shared.split(".").length === 2 } : null
}

export function JwtDecoderTool() {
	const [initial] = useState(readInitial)
	const [text, setText] = useState(initial?.text ?? "")
	const [shared, setShared] = useState(initial?.shared ?? false)
	const [keyText, setKeyText] = useState("")
	const [base64Key, setBase64Key] = useState(false)
	const [verifyOpen, setVerifyOpen] = useState(false)
	const [verification, setVerification] = useState<VerifyResult | null>(null)
	const [weakSecret, setWeakSecret] = useState<WeakSecretState>({ status: "idle" })
	const [tab, setTab] = useState<Tab>("audit")
	const [shareDialog, setShareDialog] = useState<{
		flagged: { key: string; label: string }[]
		masked: Set<string>
	} | null>(null)
	const [flash, setFlash] = useState<string | null>(null)
	const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
	const workerRef = useRef<Worker | null>(null)
	const requestRef = useRef(0)

	const loadSample = async () => {
		const sample = await makeSample()
		setShared(false)
		setText(sample.token)
		setKeyText(sample.secret)
		setBase64Key(true)
	}

	// The sample is signed at load time, so its expiry is always in the future.
	useEffect(() => {
		if (!initial) void loadSample()
	}, [])

	useEffect(
		() => () => {
			clearTimeout(flashTimer.current)
			workerRef.current?.terminate()
			workerRef.current = null
		},
		[],
	)

	const decoded = useMemo(() => decodeToken(text, { allowUnsigned: shared }), [text, shared])
	const jws = decoded.status === "ok" && decoded.kind === "jws" ? decoded : null
	const alg = decoded.status === "ok" ? decoded.header.alg : undefined
	const hmac = isHmac(alg)

	// Weak-secret check for HS* tokens, in a worker.
	useEffect(() => {
		// Whatever the new token is, the last result no longer applies: drop it, and stop
		// the worker grinding through the list for a token that's gone.
		const cancelId = ++requestRef.current
		workerRef.current?.postMessage({ type: "cancel", id: cancelId } satisfies WorkerRequest)
		setWeakSecret({ status: "idle" })
		if (!jws || !hmac || !jws.signature || shared) return
		const timer = setTimeout(() => {
			if (!workerRef.current) {
				workerRef.current = new Worker(new URL("./worker.ts", import.meta.url), {
					type: "module",
				})
				workerRef.current.onmessage = (event: MessageEvent<WorkerReply>) => {
					const reply = event.data
					if (reply.id !== requestRef.current) return
					if (reply.type === "progress") {
						setWeakSecret({
							status: "checking",
							checked: reply.checked,
							total: reply.total,
						})
					} else if (reply.type === "done") {
						setWeakSecret(
							reply.secret === null
								? { status: "clear", total: reply.total }
								: { status: "found", secret: reply.secret },
						)
					} else setWeakSecret({ status: "error", message: reply.message })
				}
			}
			const id = ++requestRef.current
			setWeakSecret({ status: "checking", checked: 0, total: 0 })
			workerRef.current.postMessage({
				type: "check",
				id,
				alg,
				signingInput: jws.signingInput,
				signature: jws.signature,
			} satisfies WorkerRequest)
		}, 250)
		return () => clearTimeout(timer)
	}, [jws, hmac, alg, shared])

	// Verify whenever the token or the key changes.
	useEffect(() => {
		if (!jws || !keyText.trim() || shared) {
			setVerification(null)
			return
		}
		let cancelled = false
		const timer = setTimeout(async () => {
			const result = await verifySignature(jws, { value: keyText, base64: base64Key }).catch(
				(): VerifyResult => ({
					status: "error",
					message: "Couldn't verify with this key.",
				}),
			)
			if (!cancelled) setVerification(result)
		}, 200)
		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [jws, keyText, base64Key, shared])

	const showFlash = (label: string) => {
		setFlash(label)
		clearTimeout(flashTimer.current)
		flashTimer.current = setTimeout(() => setFlash(null), 1600)
	}

	const auditInput =
		decoded.status === "ok"
			? {
					kind: decoded.kind,
					header: decoded.header,
					payload: decoded.kind === "jws" ? decoded.payload : undefined,
					token: decoded.token,
					shared,
					weakSecret,
					verification,
				}
			: null
	// Problems and warnings don't depend on the clock, so a snapshot is enough for the badge.
	const problemCount = auditInput
		? audit({ ...auditInput, now: Date.now() / 1000 }).filter(
				(check) => check.status === "fail" || check.status === "warn",
			).length
		: 0

	// Mark the part that failed to decode, when the token sits in the text unchanged.
	const marks = useMemo(() => {
		if (decoded.status !== "error" || !decoded.part) return undefined
		const start = text.indexOf(decoded.token)
		if (start === -1) return undefined
		const parts = decoded.token.split(".")
		const index = (["header", "payload", "signature"] as Segment[]).indexOf(decoded.part)
		const from = start + parts.slice(0, index).reduce((sum, part) => sum + part.length + 1, 0)
		const to = from + (parts[index]?.length ?? 0)
		const item: InlineMark = {
			from,
			to,
			className: "cm-mark-high",
			tooltip: { title: decoded.message },
		}
		return { doc: text, items: [item] }
	}, [decoded, text])

	/** `masked` holds `pathKey`s into `{ header, payload }`. */
	const shareLink = (masked: ReadonlySet<string>) => {
		if (!jws) return null
		const [headerPart = "", payloadPart = ""] = jws.signingInput.split(".")
		const part = (name: "header" | "payload", original: string) =>
			[...masked].some((key) => key.startsWith(`["${name}"`))
				? toBase64Url(JSON.stringify(maskPaths(jws[name], masked, [name])))
				: original
		// Never the signature: a link must not work as a login.
		return fragmentLink(WORKSPACE, {
			token: `${part("header", headerPart)}.${part("payload", payloadPart)}`,
		})
	}

	const copyLink = async (masked: ReadonlySet<string>) => {
		const link = shareLink(masked)
		if (!link) return
		try {
			await navigator.clipboard.writeText(link)
			showFlash("Link copied")
		} catch {
			showFlash("Clipboard blocked")
		}
	}

	const startShare = () => {
		if (!jws) return
		// Nested values and the header count too: a header jwk can carry a private key.
		const flagged = sensitivePaths({ header: jws.header, payload: jws.payload }).map(
			(path) => ({
				key: pathKey(path),
				// Payload paths read as claims; header ones keep their prefix.
				label: pathLabel(path[0] === "payload" ? path.slice(1) : path),
			}),
		)
		if (flagged.length > 0) {
			setShareDialog({ flagged, masked: new Set(flagged.map((item) => item.key)) })
		} else void copyLink(new Set())
	}

	const badge =
		decoded.status === "ok"
			? decoded.kind === "jwe"
				? "Encrypted (JWE)"
				: String(alg ?? "no alg")
			: decoded.status === "error"
				? "Invalid"
				: undefined
	const status =
		decoded.status === "ok"
			? {
					tone: "ok" as const,
					label:
						decoded.kind === "jwe"
							? "Encrypted JWT (JWE)"
							: shared
								? "Shared JWT, unsigned"
								: "Valid JWT",
				}
			: decoded.status === "error"
				? { tone: "error" as const, label: "Invalid JWT" }
				: { tone: "idle" as const, label: "Paste a token" }
	const verifySummary = !jws
		? "Not checked"
		: shared
			? "Signature removed"
			: algorithmFamily(alg) === undefined
				? "Nothing to verify"
				: (verification?.message.replace(/\.$/, "") ?? "Not checked")
	const verifyTone =
		verification?.status === "verified"
			? "text-success"
			: verification?.status === "invalid" || verification?.status === "error"
				? "text-destructive"
				: "text-muted-foreground"
	const decodedJson =
		decoded.status === "ok"
			? JSON.stringify(
					decoded.kind === "jws"
						? { header: decoded.header, payload: decoded.payload }
						: { header: decoded.header },
					null,
					2,
				)
			: ""

	return (
		<>
			<ResizableSplit
				left={
					<section className="flex h-full min-h-0 flex-col bg-background">
						<PaneHeader>
							<FileTab
								name="token.jwt"
								badge={badge}
								badgeTone={
									decoded.status === "error"
										? "destructive"
										: decoded.status === "ok" && decoded.kind === "jwe"
											? "neutral"
											: "brand"
								}
							/>
							<div className="ml-auto flex items-center gap-1.5">
								<Button
									size="sm"
									variant="outline"
									className={headerButton}
									onClick={() => void loadSample()}
								>
									<KeyRoundIcon />
									<span className="max-sm:hidden">Sample</span>
								</Button>
								<Button
									size="sm"
									variant="outline"
									className={headerButton}
									disabled={!text}
									onClick={() => {
										setText("")
										setKeyText("")
										setShared(false)
									}}
								>
									<EraserIcon />
									<span className="max-sm:hidden">Clear</span>
								</Button>
							</div>
						</PaneHeader>
						{shared && jws && (
							<p
								role="status"
								className="flex shrink-0 items-center gap-2 border-b border-line bg-brand/10 px-3 py-2 text-xs"
							>
								<ScissorsIcon className="size-3.5 text-brand" />
								Signature removed for sharing. This token can't be used to sign in.
							</p>
						)}
						<CodeEditor
							label="JSON Web Token"
							placeholder="Paste a JWT, with or without Bearer"
							language={jwt}
							value={text}
							onChange={(value) => {
								setText(value)
								// A pasted token is a new token, not the shared one.
								if (shared && value.split(".").length !== 2) setShared(false)
							}}
							invalid={decoded.status === "error"}
							marks={marks}
						/>
						{decoded.status !== "empty" && decoded.notes.length > 0 && (
							<p className="shrink-0 border-t border-line px-3 py-1.5 text-xs text-muted-foreground">
								{decoded.notes.join(" ")}
							</p>
						)}
						{decoded.status === "error" && (
							<ErrorCard
								title="Couldn't decode this token"
								message={decoded.message}
							/>
						)}
						{decoded.status === "ok" && decoded.kind === "jwe" && (
							<p className="mx-3 mb-3 flex gap-2 rounded-lg border border-line bg-muted/40 p-3 text-xs">
								<LockKeyholeIcon className="size-4 shrink-0 text-muted-foreground" />
								This token is encrypted. Its payload can only be read with the
								private key.
							</p>
						)}
						<div className="shrink-0 border-t border-line">
							<button
								type="button"
								aria-expanded={verifyOpen}
								className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium hover:bg-muted/40"
								onClick={() => setVerifyOpen((open) => !open)}
							>
								<ChevronRightIcon
									className={cn(
										"size-3.5 transition-transform",
										verifyOpen && "rotate-90",
									)}
								/>
								Verify signature
								<span className={cn("ml-auto truncate font-normal", verifyTone)}>
									{verification?.status === "verified" && (
										<CheckIcon className="mr-1 inline size-3.5" />
									)}
									{verifySummary}
								</span>
							</button>
							{verifyOpen && (
								<div className="flex flex-col gap-2 px-3 pb-3">
									{hmac ? (
										<div className="flex items-center gap-2">
											<Input
												aria-label="HMAC secret"
												placeholder="Secret"
												spellCheck={false}
												autoComplete="off"
												value={keyText}
												onChange={(event) => setKeyText(event.target.value)}
												className="h-8 font-mono text-xs"
											/>
											<ToggleChip
												pressed={base64Key}
												onPressedChange={setBase64Key}
											>
												Base64
											</ToggleChip>
										</div>
									) : (
										<Textarea
											aria-label="Public key"
											placeholder="Public key: PEM, JWK or JWKS (picked by kid)"
											spellCheck={false}
											rows={4}
											value={keyText}
											onChange={(event) => setKeyText(event.target.value)}
											className="max-h-40 font-mono text-xs"
										/>
									)}
									<p className="text-xs text-muted-foreground">
										Keys stay in this browser. They're never saved or put in
										share links.
									</p>
								</div>
							)}
						</div>
						<StatusBar
							tone={status.tone}
							label={status.label}
							detail={jws ? <ExpiryCountdown exp={jws.payload.exp} /> : undefined}
						/>
					</section>
				}
				right={
					<section className="flex h-full min-h-0 flex-col bg-background">
						<PaneHeader>
							<FileTab name="decoded.json" badge="Decoded" badgeTone="success" />
							<div className="ml-auto flex items-center gap-1.5">
								<CopyButton value={decodedJson} label="Copy JSON" />
								<Button
									size="sm"
									variant="outline"
									className={headerButton}
									disabled={!jws}
									title={
										decoded.status === "ok" && decoded.kind === "jwe"
											? "Encrypted tokens can't be shared without their signature"
											: undefined
									}
									onClick={startShare}
								>
									{flash ? <CheckIcon /> : <Link2Icon />}
									{flash ?? "Share"}
								</Button>
							</div>
						</PaneHeader>
						<SubBar>
							<Tabs value={tab} onValueChange={(next) => setTab(next as Tab)}>
								<TabsList className="rounded-lg">
									<TabsTrigger
										value="audit"
										className="gap-1.5 rounded-md px-2.5"
									>
										Audit
										{problemCount > 0 && (
											<Chip tone="destructive" className="px-1.5 py-0">
												{problemCount}
											</Chip>
										)}
									</TabsTrigger>
									<TabsTrigger value="claims" className="rounded-md px-2.5">
										Claims
									</TabsTrigger>
									<TabsTrigger value="header" className="rounded-md px-2.5">
										Header
									</TabsTrigger>
									<TabsTrigger value="payload" className="rounded-md px-2.5">
										Payload
									</TabsTrigger>
								</TabsList>
							</Tabs>
						</SubBar>
						{!auditInput ? (
							<p className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
								{decoded.status === "error"
									? "Fix the token on the left to see what's inside."
									: "Paste a token to decode it."}
							</p>
						) : tab === "audit" ? (
							<AuditPanel {...auditInput} />
						) : tab === "claims" ? (
							<ClaimsPanel payload={auditInput.payload} />
						) : (
							<CodeEditor
								readOnly
								label={tab === "header" ? "Header JSON" : "Payload JSON"}
								language={json}
								value={
									tab === "header"
										? JSON.stringify(auditInput.header, null, 2)
										: auditInput.payload
											? JSON.stringify(auditInput.payload, null, 2)
											: "// Encrypted: the payload needs the private key."
								}
							/>
						)}
					</section>
				}
			/>
			<Dialog
				open={shareDialog !== null}
				onOpenChange={(open) => !open && setShareDialog(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Share without the signature</DialogTitle>
						<DialogDescription>
							The link carries the header and payload only, so it can't be used to
							sign in. These values hold personal data, secrets or key material. Mask
							them in the link?
						</DialogDescription>
					</DialogHeader>
					<ul className="flex flex-col gap-1.5">
						{shareDialog?.flagged.map(({ key, label }) => (
							<li key={key}>
								<label className="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										className="size-4 accent-(--brand)"
										checked={shareDialog.masked.has(key)}
										onChange={(event) => {
											const masked = new Set(shareDialog.masked)
											if (event.target.checked) masked.add(key)
											else masked.delete(key)
											setShareDialog({ ...shareDialog, masked })
										}}
									/>
									<code className="font-mono">{label}</code>
								</label>
							</li>
						))}
					</ul>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShareDialog(null)}>
							Cancel
						</Button>
						<Button
							autoFocus
							onClick={() => {
								if (shareDialog) void copyLink(shareDialog.masked)
								setShareDialog(null)
							}}
						>
							Copy link
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
