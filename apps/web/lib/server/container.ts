import "server-only"
import { createDb } from "@workspace/db/client"
import { neonAuth } from "@/lib/auth/neon-auth"
import { authEnv, blobEnv, databaseEnv } from "@/lib/env"
import {
	CreateAdminAccount,
	GetCurrentAdmin,
	SignIn,
	SignOut,
} from "@/modules/auth/application/auth-use-cases"
import { NeonIdentityProvider } from "@/modules/auth/infrastructure/neon-identity-provider"
import { CreatePost, DeletePost, SavePost } from "@/modules/blog/application/post-commands"
import { GetPost, GetPublishedPost, ListPosts } from "@/modules/blog/application/post-queries"
import { DrizzlePostRepository } from "@/modules/blog/infrastructure/drizzle-post-repository"
import { UploadMedia } from "@/modules/media/application/upload-media"
import {
	DrizzleMediaRepository,
	VercelBlobStorage,
} from "@/modules/media/infrastructure/media-adapters"
import { cryptoIds, systemClock } from "@/modules/shared/system-adapters"

// Composition root: the only place that picks concrete adapters for the use
// cases. Each group is built on first use and reused for the process's life.

function once<T>(build: () => T) {
	let value: T | undefined
	return () => {
		value ??= build()
		return value
	}
}

const db = once(() => createDb(databaseEnv().DATABASE_URL))

export const blog = once(() => {
	const posts = new DrizzlePostRepository(db())
	return {
		createPost: new CreatePost(posts, cryptoIds),
		savePost: new SavePost(posts, systemClock),
		deletePost: new DeletePost(posts),
		listPosts: new ListPosts(posts),
		getPost: new GetPost(posts),
		getPublishedPost: new GetPublishedPost(posts),
	}
})

export const auth = once(() => {
	const env = authEnv()
	const identities = new NeonIdentityProvider(neonAuth())
	const policy = { adminEmail: env.ADMIN_EMAIL, setupEnabled: env.ADMIN_SETUP_ENABLED }
	return {
		policy,
		getCurrentAdmin: new GetCurrentAdmin(identities, policy),
		signIn: new SignIn(identities, policy),
		signOut: new SignOut(identities),
		createAdminAccount: new CreateAdminAccount(identities, policy),
	}
})

export const media = once(() => ({
	uploadMedia: new UploadMedia(
		// Matches the store prefix allowed in next.config.ts images.remotePatterns.
		new VercelBlobStorage(blobEnv().BLOB_READ_WRITE_TOKEN, "siddsingh_dev"),
		new DrizzleMediaRepository(db()),
		cryptoIds,
		systemClock,
	),
}))
