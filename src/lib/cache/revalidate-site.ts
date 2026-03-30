import { revalidatePath } from "next/cache";

function revalidateSeoArtifacts() {
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
}

export function revalidateBlogPages() {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  revalidateSeoArtifacts();
}

export function revalidateNotesPages() {
  revalidatePath("/notes");
  revalidatePath("/notes/[slug]", "page");
  revalidateSeoArtifacts();
}

export function revalidateProjectsPages() {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidateSeoArtifacts();
}

export function revalidateAboutPages() {
  revalidatePath("/about");
}

export function revalidateGuestbookPage() {
  revalidatePath("/guestbook");
}

export function revalidateEntireSite() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/projects");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/notes");
  revalidatePath("/notes/[slug]", "page");
  revalidatePath("/guestbook");
  revalidateSeoArtifacts();
}
