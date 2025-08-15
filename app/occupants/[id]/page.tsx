export default function MapPage({ params }: { params: { id: string } }) {
  // ป้องกันอักขระพิเศษ/ช่องว่าง ด้วย encodeURIComponent
  const safeId = encodeURIComponent(params.id);
  const src = `https://futurepark-app.venue.in.th/maps/place/${safeId}`;

  return (
    <main className="section">
      <div className="container-narrow">
        <h1 className="text-2xl md:text-3xl font-semibold">แผนที่ Future Park & ZPELL</h1>
        <p className="text-sm text-gray-500 mt-1">
          ค้นหาเส้นทางและตำแหน่งร้านค้าภายในศูนย์การค้า
        </p>
      </div>

      {/* Full-width iframe */}
      <div className="mt-4 w-screen relative left-1/2 right-1/2 -mx-[50vw]">
        <iframe
          src={src}
          className="w-full h-[var(--vh-available,80vh)] border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Future Park & ZPELL Map – ${params.id}`}
        />
      </div>
    </main>
  );
}
