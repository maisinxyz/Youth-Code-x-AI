import React, { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface SectionWithMockupProps {
    title: string | React.ReactNode;
    description: string | React.ReactNode;
    primaryImageSrc: string;
    secondaryImageSrc: string;
    reverseLayout?: boolean;
    children?: React.ReactNode;
    compact?: boolean;
}

const SectionWithMockup: React.FC<SectionWithMockupProps> = ({
    title,
    description,
    primaryImageSrc,
    secondaryImageSrc,
    reverseLayout = false,
    children,
    compact = false,
}) => {
    const sectionRef = useRef<HTMLElement>(null);
    const [isHoveringPrimary, setIsHoveringPrimary] = useState(false);
    const [isHoveringSecondary, setIsHoveringSecondary] = useState(false);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    });

    // Parallax: images drift at different speeds for depth
    const parallaxRange = compact ? 0.5 : 1;
    const primaryY = useTransform(scrollYProgress, [0, 1], [50 * parallaxRange, -25 * parallaxRange]);
    const secondaryY = useTransform(scrollYProgress, [0, 1], [70 * parallaxRange, -35 * parallaxRange]);
    const textY = useTransform(scrollYProgress, [0, 1], [20 * parallaxRange, -10 * parallaxRange]);

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.15,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
        },
    };

    const layoutClasses = reverseLayout
        ? "md:grid-cols-[1fr_1.4fr] md:grid-flow-col-dense"
        : "md:grid-cols-[1fr_1.4fr]";

    const textOrderClass = reverseLayout ? "md:col-start-2" : "";
    const imageOrderClass = reverseLayout ? "md:col-start-1" : "";

    // Compact vs regular sizing
    const sectionPadding = compact ? "py-6 md:py-10" : "py-16 md:py-28";
    const imgContainerMax = compact ? "max-w-[300px] md:max-w-[460px]" : "max-w-[320px] md:max-w-[520px]";
    const secondarySize = compact
        ? "w-[250px] h-[300px] md:w-[360px] md:h-[440px]"
        : "w-[280px] h-[340px] md:w-[420px] md:h-[540px]";
    const primaryHeight = compact ? "h-[320px] md:h-[500px]" : "h-[380px] md:h-[600px]";

    return (
        <section
            ref={sectionRef}
            className={`relative ${sectionPadding} bg-black overflow-hidden`}
        >
            <div className="container max-w-[1360px] w-full px-6 md:px-10 relative z-10 mx-auto">
                <motion.div
                    className={`grid grid-cols-1 gap-8 md:gap-8 w-full items-center ${layoutClasses}`}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                >
                    {/* Text Content */}
                    <motion.div
                        className={`flex flex-col items-start gap-5 md:mt-0 max-w-[500px] mx-auto md:mx-0 ${textOrderClass}`}
                        variants={itemVariants}
                        style={{ y: textY }}
                    >
                        <div>
                            <h2 className="text-white text-3xl md:text-[48px] font-semibold leading-tight md:leading-[1.1]">
                                {title}
                            </h2>
                        </div>

                        <p className="text-white/40 text-sm md:text-[15px] leading-relaxed">
                            {description}
                        </p>

                        {/* Optional extra content */}
                        {children}
                    </motion.div>

                    {/* Image stack — shifted right with md:ml-auto */}
                    <motion.div
                        className={`relative md:mt-0 md:ml-auto ${imageOrderClass} w-full ${imgContainerMax}`}
                        variants={itemVariants}
                    >
                        {/* Secondary image (behind) */}
                        <motion.div
                            className={`absolute ${secondarySize} rounded-[20px] z-0 overflow-hidden cursor-pointer`}
                            style={{
                                top: reverseLayout ? "auto" : "-2%",
                                bottom: reverseLayout ? "-2%" : "auto",
                                left: reverseLayout ? "auto" : "-18%",
                                right: reverseLayout ? "-18%" : "auto",
                                y: secondaryY,
                                boxShadow: isHoveringSecondary
                                    ? "0 40px 80px -20px rgba(0,0,0,0.9), 0 20px 40px -10px rgba(0,0,0,0.6)"
                                    : "0 30px 60px -15px rgba(0,0,0,0.7), 0 15px 30px -8px rgba(0,0,0,0.5)",
                            }}
                            onMouseEnter={() => setIsHoveringSecondary(true)}
                            onMouseLeave={() => setIsHoveringSecondary(false)}
                            whileHover={{
                                scale: 1.03,
                                rotate: -1,
                                transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                            }}
                            initial={{ opacity: 0, x: -30, rotate: 2 }}
                            whileInView={{
                                opacity: 1,
                                x: 0,
                                rotate: 0,
                                transition: { duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] },
                            }}
                            viewport={{ once: true, amount: 0.3 }}
                        >
                            <div
                                className="relative w-full h-full bg-cover bg-center rounded-[20px] transition-all duration-500"
                                style={{
                                    backgroundImage: `url(${secondaryImageSrc})`,
                                    filter: isHoveringSecondary
                                        ? "brightness(1.1)"
                                        : "brightness(0.85)",
                                }}
                            />
                            {/* Inner glow on hover */}
                            <div
                                className="absolute inset-0 rounded-[20px] transition-opacity duration-500 pointer-events-none"
                                style={{
                                    boxShadow: "inset 0 0 40px rgba(255,255,255,0.05)",
                                    opacity: isHoveringSecondary ? 1 : 0,
                                }}
                            />
                        </motion.div>

                        {/* Primary image (front) */}
                        <motion.div
                            className={`relative w-full ${primaryHeight} rounded-[20px] z-10 overflow-hidden cursor-pointer`}
                            style={{
                                y: primaryY,
                                boxShadow: isHoveringPrimary
                                    ? "0 50px 100px -25px rgba(0,0,0,0.95), 0 25px 50px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)"
                                    : "0 40px 80px -20px rgba(0,0,0,0.8), 0 20px 40px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
                            }}
                            onMouseEnter={() => setIsHoveringPrimary(true)}
                            onMouseLeave={() => setIsHoveringPrimary(false)}
                            whileHover={{
                                scale: 1.02,
                                rotate: 0.5,
                                transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                            }}
                            initial={{ opacity: 0, x: 30, rotate: -1 }}
                            whileInView={{
                                opacity: 1,
                                x: 0,
                                rotate: 0,
                                transition: { duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] },
                            }}
                            viewport={{ once: true, amount: 0.3 }}
                        >
                            <div
                                className="w-full h-full bg-cover bg-center transition-all duration-500"
                                style={{
                                    backgroundImage: `url(${primaryImageSrc})`,
                                    filter: isHoveringPrimary
                                        ? "brightness(1.1)"
                                        : "brightness(0.95)",
                                }}
                            />
                            {/* Subtle shine overlay on hover */}
                            <div
                                className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
                                style={{
                                    background:
                                        "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, transparent 100%)",
                                    opacity: isHoveringPrimary ? 1 : 0,
                                }}
                            />
                        </motion.div>

                        {/* Ground shadow beneath both cards */}
                        <div
                            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[85%] h-[40px] z-[-1]"
                            style={{
                                background:
                                    "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(0,0,0,0.7) 0%, transparent 70%)",
                                filter: "blur(16px)",
                            }}
                        />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default SectionWithMockup;
