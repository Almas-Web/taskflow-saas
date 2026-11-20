"use client";

import React, { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

function TransitionContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="relative min-h-screen w-full">{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 16, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.99 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative min-h-screen w-full"
      >
        <motion.div
          key={`${pathname}-aurora-sweep`}
          initial={{ opacity: 0.45 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-50 bg-gradient-to-tr from-violet-600/25 via-fuchsia-500/20 to-cyan-400/25"
        />
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="relative min-h-screen w-full">{children}</div>}>
      <TransitionContent>{children}</TransitionContent>
    </Suspense>
  );
}