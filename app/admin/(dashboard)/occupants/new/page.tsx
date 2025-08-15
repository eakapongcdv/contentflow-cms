// app/admin/(dashboard)/occupants/new/page.tsx
import OccupantForm from "../OccupantForm";

export default function NewOccupantPage() {
  return (
    <div className="card p-6">
      <h1 className="text-xl font-semibold">New Occupant</h1>
      <div className="mt-4">
        <OccupantForm mode="create" />
      </div>
    </div>
  );
}
