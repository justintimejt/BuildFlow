"use client";

import { motion } from "framer-motion";

export function FloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        color: `rgba(15,23,42,${0.1 + i * 0.03})`,
        width: 0.5 + i * 0.03,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full text-slate-950 dark:text-white"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        strokeOpacity={0.1 + path.id * 0.03}
                        initial={{ pathLength: 0.3, opacity: 0.6 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.3, 0.6, 0.3],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 20 + Math.random() * 10,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export function LoadingAnimation() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
            <div className="absolute inset-0">
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-700/80 dark:from-white dark:to-white/80">
                            BuildFlow
                        </span>
                    </h2>
                </motion.div>
                
                {/* Loading Spinner */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                >
                    <div className="w-16 h-16 border-4 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-white rounded-full">
                        <motion.div
                            className="w-full h-full border-4 border-transparent border-t-current rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 1,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "linear",
                            }}
                        />
                    </div>
                </motion.div>

                {/* Loading Text */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8"
                >
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 font-medium">
                        Loading...
                    </p>
                </motion.div>

                {/* Animated Dots */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex gap-2 mt-4"
                >
                    {[0, 1, 2].map((index) => (
                        <motion.div
                            key={index}
                            className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white"
                            animate={{
                                y: [0, -10, 0],
                                opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 1.2,
                                repeat: Number.POSITIVE_INFINITY,
                                delay: index * 0.2,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

