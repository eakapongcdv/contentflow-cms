// app/admin/(dashboard)/articles/new/page.tsx
import ArticleForm from "@/app/admin/(dashboard)/articles/ui/ArticleForm";

export const dynamic = "force-dynamic";

export default function NewArticlePage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">New Article</h1>
      <ArticleForm mode="create" />
    </div>
  );
}
