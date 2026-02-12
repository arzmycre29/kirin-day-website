import { motion } from 'motion/react';

interface PageSkeletonProps {
    variant?: 'default' | 'cards' | 'list';
}

function ShimmerBar({ className }: { className?: string }) {
    return (
        <div className={`relative overflow-hidden rounded-lg bg-white/5 ${className || ''}`}>
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(144, 205, 244, 0.06), transparent)',
                }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
        </div>
    );
}

export function PageSkeleton({ variant = 'default' }: PageSkeletonProps) {
    return (
        <div className="min-h-screen pt-32 pb-32 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header skeleton */}
                <div className="text-center mb-16">
                    <ShimmerBar className="h-10 w-64 mx-auto mb-6" />
                    <ShimmerBar className="h-1 w-32 mx-auto mb-6" />
                    <ShimmerBar className="h-5 w-96 max-w-full mx-auto" />
                </div>

                {/* Content skeleton based on variant */}
                {variant === 'cards' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="rounded-2xl border border-white/5 overflow-hidden">
                                <ShimmerBar className="h-64 rounded-none" />
                                <div className="p-6 space-y-3">
                                    <ShimmerBar className="h-6 w-3/4" />
                                    <ShimmerBar className="h-4 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {variant === 'list' && (
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-5 p-6 rounded-xl border border-white/5">
                                <ShimmerBar className="w-14 h-14 rounded-full flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <ShimmerBar className="h-5 w-2/3" />
                                    <ShimmerBar className="h-3 w-1/3" />
                                </div>
                                <ShimmerBar className="w-20 h-8 flex-shrink-0" />
                            </div>
                        ))}
                    </div>
                )}

                {variant === 'default' && (
                    <div className="space-y-8 max-w-5xl mx-auto">
                        <ShimmerBar className="h-72 w-full rounded-xl" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ShimmerBar className="h-40 rounded-xl" />
                            <ShimmerBar className="h-40 rounded-xl" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
