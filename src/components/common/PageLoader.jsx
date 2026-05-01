export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="inline-flex items-center gap-1 mb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-8 bg-premium-gold rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="font-display text-xl font-bold text-text-primary tracking-widest uppercase">
          Magizhchi
        </p>
        <p className="text-xs text-text-muted tracking-[0.3em] uppercase mt-1">Garments</p>
      </div>
    </div>
  );
}
