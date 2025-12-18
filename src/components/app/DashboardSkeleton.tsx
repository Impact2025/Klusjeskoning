'use client';

/**
 * Skeleton loading component for dashboards
 * Shows instantly while actual data is loading
 */

interface SkeletonProps {
  className?: string;
}

const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export function ParentDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Header Skeleton */}
      <header className="bg-gradient-to-r from-sky-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="w-14 h-14 rounded-xl bg-white/20" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 bg-white/20" />
              <Skeleton className="h-4 w-24 bg-white/20" />
            </div>
          </div>
          <div className="flex space-x-2">
            <Skeleton className="w-10 h-10 rounded-lg bg-white/20" />
            <Skeleton className="w-10 h-10 rounded-lg bg-white/20" />
          </div>
        </div>
      </header>

      {/* Content Skeleton */}
      <main className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))}
        </div>

        {/* Section Headers + Cards */}
        {[1, 2].map((section) => (
          <div key={section} className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm flex items-center space-x-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="w-16 h-8 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Loading indicator */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-600">Laden...</span>
      </div>
    </div>
  );
}

export function ChildDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header Skeleton */}
      <header className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-14 h-14 rounded-xl bg-white/20" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-28 bg-white/20" />
              <Skeleton className="h-4 w-20 bg-white/20" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="w-20 h-12 rounded-xl bg-white/20" />
            <Skeleton className="w-9 h-9 rounded-xl bg-white/20" />
            <Skeleton className="w-9 h-9 rounded-xl bg-white/20" />
          </div>
        </div>

        {/* XP Bar Skeleton */}
        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex justify-between mb-2">
            <Skeleton className="h-4 w-32 bg-white/20" />
            <Skeleton className="h-4 w-16 bg-white/20" />
          </div>
          <Skeleton className="h-3 w-full rounded-full bg-white/20" />
        </div>
      </header>

      {/* Spacer */}
      <div className="h-4" />

      {/* Content Skeleton */}
      <main className="p-6 space-y-6 pb-24">
        {/* Welcome */}
        <div className="text-center space-y-2">
          <Skeleton className="h-7 w-48 mx-auto" />
          <Skeleton className="h-5 w-64 mx-auto" />
        </div>

        {/* Chores Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-14 h-14 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="w-20 h-10 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Nav Skeleton */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-2">
        <div className="flex justify-around">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center space-y-1">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </nav>

      {/* Loading indicator */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 z-50">
        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-600">Even geduld...</span>
      </div>
    </div>
  );
}

export default { ParentDashboardSkeleton, ChildDashboardSkeleton };
