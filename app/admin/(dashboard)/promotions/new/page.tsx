import PromotionForm from "../ui/PromotionForm";

export default function NewPromotionPage() {
  return (
    <div className="card p-5">
      <h1 className="text-xl font-semibold mb-4">New Promotion</h1>
      <PromotionForm mode="create" />
    </div>
  );
}
