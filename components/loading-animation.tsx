"use client"

import type React from "react"
import { motion } from "framer-motion"

interface LoadingAnimationProps {
  size?: "small" | "medium" | "large"
  text?: string
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ size = "medium", text = "Loading" }) => {
  // Size configurations
  const config = {
    small: {
      container: "h-8",
      dot: "w-1.5 h-1.5",
      text: "text-xs",
      gap: "gap-1",
    },
    medium: {
      container: "h-16",
      dot: "w-3 h-3",
      text: "text-sm",
      gap: "gap-2",
    },
    large: {
      container: "h-24",
      dot: "w-4 h-4",
      text: "text-base",
      gap: "gap-3",
    },
  }

  const { container, dot, text: textSize, gap } = config[size]

  // Animation variants
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const dotVariants = {
    initial: {
      y: 0,
      opacity: 0.4,
    },
    animate: {
      y: [0, -10, 0],
      opacity: [0.4, 1, 0.4],
      transition: {
        duration: 1,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  }

  const colors = ["bg-green-500", "bg-lime-500", "bg-emerald-500"]

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        className={`flex items-center ${gap} ${container}`}
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {colors.map((color, index) => (
          <motion.div key={index} className={`${dot} ${color} rounded-full`} variants={dotVariants} />
        ))}
      </motion.div>
      {text && (
        <motion.p
          className={`${textSize} text-gray-600 mt-2 font-medium`}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.5, 1, 0.5],
            transition: {
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            },
          }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

export default LoadingAnimation
