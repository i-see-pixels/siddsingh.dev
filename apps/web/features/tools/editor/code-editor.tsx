"use client"

import { indentUnit } from "@codemirror/language"
import { Compartment, EditorState, type Extension } from "@codemirror/state"
import { EditorView, placeholder as placeholderText } from "@codemirror/view"
import { cn } from "@workspace/ui/lib/utils"
import { type RefObject, useEffect, useMemo, useRef, useState } from "react"
import { editorCore, setErrorLine } from "./core"
import { plainText } from "./languages/text"
import { type InlineMark, setMarks } from "./marks"
import type { EditorLanguage } from "./types"

/**
 * The editor every tool uses. The core behaviour is fixed; the language and any extra
 * CodeMirror extensions are injected, so a tool decides what it edits without the editor
 * knowing about it.
 */
export function CodeEditor({
	value,
	onChange,
	label,
	language = plainText,
	extensions,
	docKey,
	placeholder,
	errorLine,
	marks,
	invalid,
	readOnly,
	editorRef,
	className,
}: {
	value: string
	onChange?: (value: string) => void
	label: string
	language?: EditorLanguage
	/** Extra extensions on top of the language. Keep the reference stable across renders. */
	extensions?: Extension
	/** A new key swaps in a fresh document with its own undo history. */
	docKey?: string
	placeholder?: string
	/** 1-based line to mark as the error. */
	errorLine?: number
	/**
	 * Highlighted ranges with optional hover cards, and the text they were computed from.
	 * They're applied only while the editor still holds that text.
	 */
	marks?: { doc: string; items: InlineMark[] }
	invalid?: boolean
	readOnly?: boolean
	/** The live view, for tools that make precise edits (one undoable change per action). */
	editorRef?: RefObject<EditorView | null>
	className?: string
}) {
	const hostRef = useRef<HTMLDivElement>(null)
	const viewRef = useRef<EditorView | null>(null)
	const docKeyRef = useRef(docKey)
	const onChangeRef = useRef(onChange)
	onChangeRef.current = onChange
	const [configurable] = useState(() => new Compartment())

	// Everything that can change after mount, swapped in through one compartment.
	const configuration = useMemo(() => {
		const unit = language.indentUnit ?? "  "
		return [
			language.extensions,
			indentUnit.of(unit),
			EditorState.tabSize.of(unit === "\t" ? 4 : unit.length),
			language.wrap ? EditorView.lineWrapping : [],
			readOnly ? EditorState.readOnly.of(true) : [],
			placeholder ? placeholderText(placeholder) : [],
			EditorView.contentAttributes.of({
				"aria-label": label,
				...(invalid ? { "aria-invalid": "true" } : {}),
				...(readOnly ? { "aria-readonly": "true" } : {}),
			}),
			extensions ?? [],
		]
	}, [language, readOnly, placeholder, label, invalid, extensions])
	const configurationRef = useRef(configuration)
	configurationRef.current = configuration

	const createState = (doc: string) =>
		EditorState.create({
			doc,
			extensions: [
				editorCore,
				configurable.of(configurationRef.current),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) onChangeRef.current?.(update.state.doc.toString())
				}),
			],
		})

	// Built once; the effects below push later prop changes into the live view.
	useEffect(() => {
		if (!hostRef.current) return
		const view = new EditorView({ parent: hostRef.current, state: createState(value) })
		viewRef.current = view
		if (editorRef) editorRef.current = view
		return () => {
			view.destroy()
			viewRef.current = null
			if (editorRef) editorRef.current = null
		}
	}, [])

	useEffect(() => {
		viewRef.current?.dispatch({ effects: configurable.reconfigure(configuration) })
	}, [configurable, configuration])

	// Switching documents starts fresh; any other outside change is an ordinary, undoable edit.
	useEffect(() => {
		const view = viewRef.current
		if (!view) return
		if (docKeyRef.current !== docKey) {
			docKeyRef.current = docKey
			view.setState(createState(value))
		} else if (view.state.doc.toString() !== value) {
			view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
		}
	}, [value, docKey])

	useEffect(() => {
		viewRef.current?.dispatch({ effects: setErrorLine.of(errorLine) })
	}, [errorLine])

	// Runs after the value effect above, so a new document and its marks land together.
	useEffect(() => {
		const view = viewRef.current
		if (!view) return
		if (!marks) view.dispatch({ effects: setMarks.of([]) })
		else if (view.state.doc.toString() === marks.doc)
			view.dispatch({ effects: setMarks.of(marks.items) })
	}, [marks])

	return (
		<div
			ref={hostRef}
			data-language={language.name}
			className={cn(
				"min-h-0 flex-1 overflow-hidden font-mono text-[13px] leading-6",
				className,
			)}
		/>
	)
}
