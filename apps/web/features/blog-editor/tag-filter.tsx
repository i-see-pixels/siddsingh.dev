"use client"

import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
	useComboboxAnchor,
} from "@workspace/ui/components/combobox"

/** Pick any number of tags, typing to narrow the list. */
export function TagFilter({
	tags,
	value,
	onChange,
}: {
	tags: string[]
	value: string[]
	onChange: (tags: string[]) => void
}) {
	const anchor = useComboboxAnchor()

	return (
		<Combobox multiple autoHighlight items={tags} value={value} onValueChange={onChange}>
			<ComboboxChips ref={anchor} className="w-full sm:w-64">
				<ComboboxValue>
					{(selected: string[]) => (
						<>
							{selected.map((tag) => (
								<ComboboxChip key={tag}>{tag}</ComboboxChip>
							))}
							<ComboboxChipsInput
								aria-label="Filter by tags"
								placeholder={selected.length > 0 ? "" : "Filter by tags"}
							/>
						</>
					)}
				</ComboboxValue>
			</ComboboxChips>
			<ComboboxContent anchor={anchor}>
				<ComboboxEmpty>No tags found.</ComboboxEmpty>
				<ComboboxList>
					{(tag: string) => (
						<ComboboxItem key={tag} value={tag}>
							{tag}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	)
}
