'use client';

import React from 'react';
import Lottie from 'lottie-react';
import animationData from '../../public/Woman Strength Training with Dumbbells.json';
import { motion } from 'framer-motion';

interface LottieLoaderProps {
    size?: number;
    className?: string;
}

const LottieLoader = ({ size = 130, className = "" }: LottieLoaderProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={`relative flex items-center justify-center rounded-2xl ${className}`}
            style={{ width: size + 40, height: size + 40 }}
        >
            <div style={{ width: size, height: size }}>
                <Lottie
                    animationData={animationData}
                    loop={true}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
        </motion.div>
    );
};

export default LottieLoader;
