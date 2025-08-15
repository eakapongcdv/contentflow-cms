"use client";

export default function GeoSortButton({ q, active, hasCoord }: { q: string; active: boolean; hasCoord: boolean }) {
  async function goNearby() {
    if (!("geolocation" in navigator)) {
      alert("เบราว์เซอร์ไม่รองรับตำแหน่ง");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `/?q=${encodeURIComponent(q)}&sort=nearby&lat=${latitude}&lng=${longitude}`;
        window.location.href = url;
      },
      (err) => {
        alert("ไม่สามารถดึงตำแหน่งได้: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  if (active && hasCoord) {
    return <span className="px-3 py-1 rounded-full bg-black text-white">Nearby</span>;
  }
  return (
    <button type="button" onClick={goNearby} className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200">
      Nearby
    </button>
  );
}
