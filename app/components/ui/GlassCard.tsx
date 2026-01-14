'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    gradient?: boolean;
}

export function GlassCard({ children, className = '', hover = true, gradient = false }: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={hover ? { scale: 1.02, y: -5 } : {}}
            className={`
        relative overflow-hidden rounded-2xl
        bg-white/10 backdrop-blur-lg
        border border-white/20
        shadow-xl shadow-purple-500/10
        ${gradient ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10' : ''}
        ${className}
      `}
        >
            {gradient && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 pointer-events-none" />
            )}
            {children}
        </motion.div>
    );
}
