// components/admin-nav.tsx
export default function AdminNav() {
  return (
    <nav className="flex flex-col gap-1">
      {/* ... เมนูอื่น ... */}
      <a href="/admin/events" className="px-3 py-2 rounded hover:bg-gray-100">
        Events
      </a>
    </nav>
  );
}
