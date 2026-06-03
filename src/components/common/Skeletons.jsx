
const SkeletonBase = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-2xl ${className}`} />
);



export const FormSkeleton = () => (
  <div className="space-y-12 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-3">
        <SkeletonBase className="h-8 w-64" />
        <SkeletonBase className="h-3 w-48" />
      </div>
      <div className="flex gap-4">
        <SkeletonBase className="h-12 w-32 rounded-xl" />
        <SkeletonBase className="h-12 w-32 rounded-xl" />
      </div>
    </div>
    <div className="flex gap-4 border-b border-border-light pb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonBase key={i} className="h-10 w-32 rounded-lg" />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <SkeletonBase className="h-3 w-24" />
          <SkeletonBase className="h-12 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <SkeletonBase className="h-3 w-24" />
          <SkeletonBase className="h-32 w-full rounded-xl" />
        </div>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <SkeletonBase className="h-3 w-24" />
          <SkeletonBase className="h-12 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <SkeletonBase className="h-3 w-24" />
          <SkeletonBase className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-border-light shadow-sm flex items-center gap-4">
    <SkeletonBase className="w-14 h-14 rounded-2xl" />
    <div className="space-y-2">
      <SkeletonBase className="w-20 h-3" />
      <SkeletonBase className="w-16 h-6" />
    </div>
  </div>
);

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-[3rem] border border-border-light overflow-hidden shadow-sm flex flex-col h-full">
    <SkeletonBase className="aspect-[4/5] rounded-none w-full" />
    <div className="p-4 md:p-8 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <SkeletonBase className="w-32 h-6" />
          <SkeletonBase className="w-16 h-3" />
        </div>
        <SkeletonBase className="w-20 h-8" />
      </div>
      <div className="pt-6 border-t border-border-light flex justify-between items-center">
        <div className="space-y-1">
          <SkeletonBase className="w-12 h-2" />
          <SkeletonBase className="w-24 h-4" />
        </div>
      </div>
    </div>
  </div>
);

export const TableRowSkeleton = ({ columns = 5 }) => (
  <tr className="border-b border-border-light/30">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 md:px-8 py-4 md:py-8">
        <SkeletonBase className={`h-4 ${i === 0 ? 'w-48' : 'w-24'}`} />
      </td>
    ))}
  </tr>
);



export const PosProductSkeleton = () => (
  <div className="bg-white p-4 rounded-[2rem] border border-border-light flex flex-col gap-4 animate-pulse">
    <div className="aspect-square bg-gray-100 rounded-2xl w-full" />
    <div className="px-1 space-y-3">
      <div className="h-3 bg-gray-100 rounded w-3/4" />
      <div className="flex justify-between items-center">
        <div className="h-5 bg-gray-100 rounded w-1/3" />
        <div className="h-6 bg-gray-100 rounded-lg w-1/4" />
      </div>
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-8 p-4 md:p-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white rounded-[3rem] p-4 md:p-8 border border-border-light h-96">
        <SkeletonBase className="w-48 h-8 mb-8" />
        <SkeletonBase className="w-full h-64" />
      </div>
      <div className="bg-white rounded-[3rem] p-4 md:p-8 border border-border-light h-96">
        <SkeletonBase className="w-48 h-8 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <SkeletonBase className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonBase className="w-full h-4" />
                <SkeletonBase className="w-24 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
