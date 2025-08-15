// app/admin/(dashboard)/users/invite/page.tsx
import UserForm from "../ui/UserForm";

export default function InviteUserPage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Invite User</h1>
      <div className="card p-4">
        <UserForm mode="create" />
      </div>
    </div>
  );
}
