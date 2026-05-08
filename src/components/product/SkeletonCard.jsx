import { motion } from 'framer-motion';

export default function SkeletonCard() {
  return (
    <div className="w-full">
      {/* Image Skeleton */}
      <div className="relative aspect-[4/5] w-full rounded-[2.5rem] bg-gray-200 overflow-hidden mb-4 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-[shimmer_2s_infinite]" />
      </div>

      {/* Text Skeletons */}
      <div className="px-2 space-y-3">
        <div className="flex justify-between items-center gap-2">
          <div className="h-4 bg-gray-200 rounded-full w-3/4 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded-full w-1/4 animate-pulse" />
        </div>
        <div className="h-2 bg-gray-100 rounded-full w-1/3 animate-pulse" />
        <div className="flex gap-3">
          <div className="h-5 bg-gray-200 rounded-full w-1/3 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded-full w-1/4 mt-1 animate-pulse" />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
      `}</style>
    </div>
  );
}
