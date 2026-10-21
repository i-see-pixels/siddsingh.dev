ALTER TABLE "posts" ADD COLUMN "cover_image_url" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "cover_image_alt" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "seo_title" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "seo_description" text DEFAULT '' NOT NULL;