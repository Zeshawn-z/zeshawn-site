import type { Metadata } from "next";
import { getAllPosts } from "@/lib/db/data";
import SpotlightSection from "@/components/common/SpotlightSection";
import BlogIndex from "@/components/blog/BlogIndex";

export const metadata: Metadata = {
  title: "博客",
  description: "技术博客与文章",
};

export const dynamic = "force-dynamic";
export const revalidate = 30; // 每 30 秒重新验证一次

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8">
      <SpotlightSection>
        <section className="pb-16 pt-16">
          <BlogIndex
            posts={posts}
            showHeading
            headingTitle="博客"
            headingDescription="记录技术探索、项目实践和个人思考。"
          />
        </section>
      </SpotlightSection>
    </div>
  );
}
