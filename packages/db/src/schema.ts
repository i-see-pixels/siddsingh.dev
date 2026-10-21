import { sql } from "drizzle-orm"
import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

// Column names are camelCase here and snake_case in Postgres (`casing` in
// client.ts and drizzle.config.ts). Users and sessions belong to Neon Auth,
// which keeps them in its own `neon_auth` schema; nothing here references them.

const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow()

export const postStatus = pgEnum("post_status", ["draft", "published"])

export const posts = pgTable(
	"posts",
	{
		id: uuid().primaryKey().defaultRandom(),
		slug: text().notNull().unique(),
		title: text().notNull(),
		summary: text().notNull().default(""),
		/** Markdown source. */
		content: text().notNull().default(""),
		tags: text().array().notNull().default(sql`'{}'::text[]`),
		status: postStatus().notNull().default("draft"),
		/** Header image on the article and its banner on /blog; also the social card. */
		coverImageUrl: text(),
		coverImageAlt: text().notNull().default(""),
		/** Search and social overrides; empty means "use the title / summary". */
		seoTitle: text().notNull().default(""),
		seoDescription: text().notNull().default(""),
		publishedAt: timestamp({ withTimezone: true }),
		createdAt: createdAt(),
		updatedAt: timestamp({ withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index().on(table.status, table.publishedAt)],
)

/** Images uploaded from the editor. The files live in Vercel Blob; this is the index. */
export const media = pgTable("media", {
	id: uuid().primaryKey().defaultRandom(),
	url: text().notNull(),
	pathname: text().notNull().unique(),
	contentType: text().notNull(),
	size: integer().notNull(),
	alt: text().notNull().default(""),
	createdAt: createdAt(),
})
