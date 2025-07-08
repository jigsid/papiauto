"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  MenuIcon,
  ArrowRight,
  Instagram,
  Sparkles,
  Zap,
  ChevronDown,
  MessageSquare,
  Heart,
  Share2,
  Smartphone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, ReactNode, useRef } from "react";
import ChatbotIframe from "./chatbotiframe";
import DemoSignInButton from '@/components/demo-sign-in-button'
import DirectDemoLogin from '@/components/direct-demo-login'

interface FloatingElementProps {
  children: ReactNode;
  offset?: number;
  duration?: number;
}

const FloatingElement = ({
  children,
  offset = 20,
  duration = 3,
}: FloatingElementProps) => {
  return (
    <motion.div
      animate={{
        y: [offset, -offset],
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
};

// Scroll-triggered animation component
interface RevealOnScrollProps {
  children: ReactNode;
  delay?: number;
}

const RevealOnScroll = ({ children, delay = 0 }: RevealOnScrollProps) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["0 1", "0.2 0.8"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [50, 0]);
  
  return (
    <motion.div
      ref={ref}
      style={{ opacity, y }}
      transition={{ duration: 0.8, delay }}
    >
      {children}
    </motion.div>
  );
};

// Parallax effect component
interface ParallaxSectionProps {
  children: ReactNode;
  speed?: number;
}

const ParallaxSection = ({ children, speed = 0.5 }: ParallaxSectionProps) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 100}%`]);
  
  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  );
};

// Horizontal scroll component
interface HorizontalScrollProps {
  children: ReactNode;
}

const HorizontalScroll = ({ children }: HorizontalScrollProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-80%"]);
  
  return (
    <div ref={containerRef} className="relative h-[70vh] overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-slate-900 via-transparent to-slate-900 z-10 pointer-events-none"></div>
      <motion.div className="absolute top-0 left-0 h-full flex items-center" style={{ x }}>
        {children}
      </motion.div>
      
      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-blue-300 text-sm mb-2">Scroll to explore all features</span>
        <div className="flex space-x-1">
          <motion.div 
            className="w-10 h-1 bg-blue-400 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
          ></motion.div>
          <motion.div 
            className="w-10 h-1 bg-blue-400 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
          ></motion.div>
          <motion.div 
            className="w-10 h-1 bg-blue-400 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, delay: 1, repeat: Infinity, repeatType: "reverse" }}
          ></motion.div>
        </div>
      </motion.div>
    </div>
  );
};

// 3D Card component
interface Card3DProps {
  children: ReactNode;
}

const Card3D = ({ children }: Card3DProps) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateXValue = ((y - centerY) / centerY) * -10;
    const rotateYValue = ((x - centerX) / centerX) * 10;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };
  
  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };
  
  return (
    <motion.div
      className="relative perspective-1000 w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'transform 0.1s ease-out'
      }}
    >
      <div className="w-full h-full transform-style-3d">
        {children}
      </div>
    </motion.div>
  );
};

// Sticky section component
const StickySection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  // Adjusted transition points for smoother animations
  const opacity1 = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const opacity2 = useTransform(scrollYProgress, [0.25, 0.35, 0.65], [0, 1, 0]);
  const opacity3 = useTransform(scrollYProgress, [0.65, 0.85], [0, 1]);
  
  const scale1 = useTransform(scrollYProgress, [0, 0.25], [1, 0.8]);
  const scale2 = useTransform(scrollYProgress, [0.25, 0.35, 0.65], [0.8, 1, 0.8]);
  const scale3 = useTransform(scrollYProgress, [0.65, 0.85], [0.8, 1]);
  
  const y1 = useTransform(scrollYProgress, [0, 0.25], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0.25, 0.65], [50, -50]);
  const y3 = useTransform(scrollYProgress, [0.65, 0.85], [50, 0]);
  
  return (
    <div ref={containerRef} className="h-[200vh] relative">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-blue-900 z-0" />
        
        {/* Grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] z-10" />
        
        {/* Content sections */}
        <div className="container relative z-20 px-4">
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
            style={{ opacity: opacity1, scale: scale1, y: y1 }}
          >
            <motion.div 
              className="w-24 h-24 mb-8 rounded-full bg-blue-500/20 flex items-center justify-center"
              animate={{ 
                boxShadow: [
                  "0 0 0 0 rgba(59, 130, 246, 0.4)",
                  "0 0 0 20px rgba(59, 130, 246, 0)",
                ]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "loop"
              }}
            >
              <Instagram className="w-12 h-12 text-blue-400" />
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Connect Your Account</h2>
            <p className="text-xl text-blue-200 max-w-2xl">
              Link your Instagram account in seconds with our secure OAuth integration
            </p>
          </motion.div>
          
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
            style={{ opacity: opacity2, scale: scale2, y: y2 }}
          >
            <motion.div 
              className="w-24 h-24 mb-8 rounded-full bg-purple-500/20 flex items-center justify-center"
              animate={{ 
                rotate: [0, 360],
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear"
              }}
            >
              <Zap className="w-12 h-12 text-purple-400" />
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Set Up Automations</h2>
            <p className="text-xl text-blue-200 max-w-2xl">
              Create powerful response workflows that engage your audience automatically
            </p>
          </motion.div>
          
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
            style={{ opacity: opacity3, scale: scale3, y: y3 }}
          >
            <motion.div 
              className="w-24 h-24 mb-8 rounded-full bg-pink-500/20 flex items-center justify-center"
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "loop"
              }}
            >
              <MessageSquare className="w-12 h-12 text-pink-400" />
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Watch Your Growth</h2>
            <p className="text-xl text-blue-200 max-w-2xl">
              Monitor your engagement metrics and see your audience grow in real-time
            </p>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-blue-300 text-sm mb-2">Scroll to continue</span>
          <ChevronDown className="w-5 h-5 text-blue-300" />
        </motion.div>
      </div>
    </div>
  );
};

// Mouse parallax component
interface MouseParallaxProps {
  children: ReactNode;
  strength?: number;
}

const MouseParallax = ({ children, strength = 20 }: MouseParallaxProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    // Initialize window size
    handleResize();
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  
  const x = (mousePosition.x / windowSize.width - 0.5) * strength;
  const y = (mousePosition.y / windowSize.height - 0.5) * strength;
  
  return (
    <motion.div
      style={{
        x: -x,
        y: -y
      }}
      transition={{
        type: "spring",
        damping: 15,
        stiffness: 150
      }}
    >
      {children}
    </motion.div>
  );
};

// Glassmorphism section with blur effect on scroll
const GlassmorphismSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const blur = useTransform(scrollYProgress, [0, 0.5, 1], [0, 10, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.1, 0.3, 0.1]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.5, 1], ["30%", "10%", "30%"]);
  
  return (
    <section ref={containerRef} className="py-32 relative overflow-hidden bg-gradient-to-b from-blue-900 to-slate-900">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-500/30 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-500/30 blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium">
            Why Boostly?
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tighter sm:text-5xl text-white">
            The Clear Choice for Instagram Growth
          </h2>
        </div>
        
        <div className="flex justify-center">
          <motion.div 
            className="relative max-w-3xl w-full"
            style={{
              scale,
            }}
          >
            <motion.div 
              className="absolute inset-0 bg-white/10 rounded-2xl"
              style={{
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
                opacity,
                borderRadius
              }}
            ></motion.div>
            
            <div className="relative glass rounded-2xl p-8 md:p-12 border border-white/20 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    title: "Unlimited Automations",
                    description: "No limits on how many automations you can create, unlike competitors who charge per automation",
                    icon: <Zap className="w-6 h-6 text-blue-400" />
                  },
                  {
                    title: "AI-Powered Responses",
                    description: "Our advanced AI creates personalized, natural-sounding responses that engage your audience",
                    icon: <Sparkles className="w-6 h-6 text-purple-400" />
                  },
                  {
                    title: "Primary Inbox Delivery",
                    description: "Our messages land in your followers' primary inbox, not in requests where they might be missed",
                    icon: <MessageSquare className="w-6 h-6 text-pink-400" />
                  },
                  {
                    title: "Detailed Analytics",
                    description: "Track your growth with comprehensive analytics and insights on your audience engagement",
                    icon: <CheckCircle className="w-6 h-6 text-green-400" />
                  }
                ].map((feature, index) => (
                  <motion.div 
                    key={index}
                    className="flex gap-4 items-start"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-sm text-blue-100/80">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl"></div>
              <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-purple-500/10 blur-2xl"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Animation type definitions
interface PulseElement {
  top: string;
  left: string;
  size: string;
  color: string;
  delay: number;
}

interface OrbitElement {
  radius: number;
  speed: number;
  size: string;
  color: string;
}

interface FloatElement {
  top: string;
  left: string;
  size: string;
  color: string;
  duration: number;
}

interface WaveElement {
  width: string;
  height: string;
  color: string;
  delay: number;
}

interface ExpandElement {
  size: string;
  color: string;
  delay: number;
}

type AnimationType = 
  | { type: "pulse"; elements: PulseElement[] }
  | { type: "orbit"; elements: OrbitElement[] }
  | { type: "float"; elements: FloatElement[] }
  | { type: "wave"; elements: WaveElement[] }
  | { type: "expand"; elements: ExpandElement[] };

interface CardStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  image: string;
  animation: AnimationType;
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  
  const headerOpacity = useTransform(
    scrollYProgress,
    [0, 0.1],
    [1, 0.95]
  );
  
  const headerBlur = useTransform(
    scrollYProgress,
    [0, 0.1],
    [0, 8]
  );

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const plans = [
    {
      name: "Free Plan",
      description: "Perfect for getting started",
      price: "$0",
      features: [
        "Boost engagement with target responses",
        "Automate comment replies to enhance audience interaction",
        "Turn followers into customers with targeted messaging",
      ],
      cta: "Get Started",
      icon: <Sparkles className="w-6 h-6" />,
    },
    {
      name: "Smart AI Plan",
      description: "Advanced features for power users",
      price: "$99",
      features: [
        "All features from Free Plan",
        "AI-powered response generation",
        "Advanced analytics and insights",
        "Priority customer support",
        "Custom branding options",
      ],
      cta: "Upgrade Now",
      icon: <Zap className="w-6 h-6" />,
    },
  ];

  // Testimonial data
  const testimonials = [
    {
      name: "Alex Johnson",
      role: "Fitness Influencer",
      content: "Boostly has completely transformed how I engage with my audience. My response rate has increased by 300% and I'm converting more followers into clients.",
      avatar: "A"
    },
    {
      name: "Sarah Williams",
      role: "Fashion Blogger",
      content: "The automated responses feel so personal that my followers think I'm messaging them directly. This has been a game-changer for my brand partnerships.",
      avatar: "S"
    },
    {
      name: "Michael Chen",
      role: "Tech Reviewer",
      content: "I was skeptical at first, but the AI responses are incredibly accurate and on-brand. I've saved hours each day while growing my engagement.",
      avatar: "M"
    }
  ];

  return (
    <main className="relative overflow-hidden">
      {/* Static background gradient instead of animated one */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 opacity-30"
      />

      {/* Sticky header with blur effect on scroll */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 px-4 py-4 backdrop-blur-lg"
        style={{ 
          opacity: headerOpacity,
          backdropFilter: `blur(${headerBlur}px)`,
          backgroundColor: "rgba(15, 23, 42, 0.8)"
        }}
      >
        <div className="container mx-auto flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="relative h-10 w-10 flex items-center justify-center group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Glowing background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              
              {/* White circular background */}
              <div className="absolute inset-0 bg-white rounded-lg"></div>
              
              {/* Logo letter with gradient */}
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-xl">B</span>
              
              {/* Subtle ring */}
              <div className="absolute inset-0 border border-white/30 rounded-lg"></div>
            </motion.div>
            
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white tracking-tight">
                Boostly
              </span>
              <span className="text-xs text-blue-300 -mt-1">Instagram Automation</span>
            </div>
          </motion.div>

          <nav
            className={`${
              isMenuOpen ? "block" : "hidden"
            } absolute top-20 left-0 right-0 bg-slate-900/95 p-4 md:relative md:top-0 md:bg-transparent md:p-0 md:block backdrop-blur-lg md:backdrop-blur-none z-50`}
          >
            <motion.div
              className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-8 text-sm text-blue-200"
              variants={staggerChildren}
              initial="initial"
              animate="animate"
            >
              {["Features", "Pricing", "About", "Testimonials"].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05 }}
                >
                  <Link
                    href={`#${item.toLowerCase()}`}
                    className="hover:text-white transition-colors relative group font-medium"
                  >
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all group-hover:w-full" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </nav>

          <div className="flex items-center gap-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-black text-white hover:bg-blue-50 hover:text-black transition-all group relative overflow-hidden">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2"
                  >
                    Login
                    <motion.div
                      className="relative"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
            <motion.button
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MenuIcon className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-bg pt-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        {/* Static floating elements instead of mouse parallax */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-20 h-20 bg-blue-500/10 rounded-full blur-xl">
            <motion.div 
              animate={{ y: [0, -30, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
              className="w-full h-full"
            />
          </div>
          <div className="absolute top-40 right-40 w-32 h-32 bg-purple-500/10 rounded-full blur-xl">
            <motion.div 
              animate={{ y: [0, -25, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, repeatType: "reverse" }}
              className="w-full h-full"
            />
          </div>
          <div className="absolute bottom-40 left-1/3 w-24 h-24 bg-pink-500/10 rounded-full blur-xl">
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
              className="w-full h-full"
            />
          </div>
          
          {/* Additional particles */}
          <motion.div 
            className="absolute top-1/4 left-1/4 w-4 h-4 bg-blue-400/30 rounded-full blur-sm"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div 
            className="absolute top-1/3 right-1/3 w-6 h-6 bg-purple-400/20 rounded-full blur-sm"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-5 h-5 bg-pink-400/30 rounded-full blur-sm"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3.5, repeat: Infinity }}
          />
        </div>

        <div className="relative">
          <div className="container px-4 py-6 md:py-8 mx-auto">
            {/* Hero section with split layout */}
            <div className="flex flex-col lg:flex-row items-center gap-8 pt-10">
              {/* Left side - Text content */}
              <div className="w-full lg:w-1/2 order-2 lg:order-1">
                <motion.div
                  className="mx-auto max-w-2xl text-left relative" 
                  ref={heroRef}
                >
                  <motion.h1
                    className="text-4xl font-bold leading-tight tracking-tighter text-white sm:text-5xl md:text-6xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                  >
                    Transform Your Instagram Engagement with{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                      Boostly
                    </span>
                  </motion.h1>

                  <motion.p
                    className="mt-6 text-lg text-blue-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                  >
                    Boostly revolutionizes how you connect with your audience on
                    Instagram. Automate responses and boost engagement effortlessly,
                    turning interactions into valuable business opportunities.
                  </motion.p>

                  <motion.div
                    className="mt-8 flex flex-col sm:flex-row gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                  >
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transform hover:scale-105 transition-all group relative overflow-hidden shadow-lg"
                    >
                      <Link
                        href="/dashboard"
                        className="relative z-10 flex items-center gap-2"
                      >
                        Get Started
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <ArrowRight className="w-5 h-5" />
                        </motion.div>
                      </Link>
                    </Button>
                    <DirectDemoLogin 
                      variant="secondary"
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium transform hover:scale-105 transition-all shadow-lg"
                    />
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-blue-400 hover:bg-blue-900/50 transform hover:scale-105 transition-all shadow-lg"
                    >
                      Learn More
                    </Button>
                  </motion.div>
                  
                  <motion.p
                    className="mt-4 text-sm text-blue-300 opacity-80"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.8 }}
                  >
                    ✨ Try Demo instantly gives you access to all features - no sign up required!
                  </motion.p>
                </motion.div>
              </div>
              
              {/* Right side - Laptop mockup with improved video */}
              <div className="w-full lg:w-1/2 order-1 lg:order-2">
                <motion.div 
                  className="relative z-20 mx-auto"
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  {/* Laptop mockup */}
                  <div className="relative mx-auto w-full max-w-[600px]">
                    {/* Laptop lid with screen */}
                    <div className="relative rounded-t-xl overflow-hidden bg-gray-800 border-8 border-gray-800 border-b-0 aspect-[16/10] shadow-2xl">
                      {/* Screen content with improved video rendering */}
                      <div className="relative w-full h-full overflow-hidden">
                        {/* Video background with optimized rendering */}
                        <div className="absolute inset-0 bg-black">
                          <video 
                            src="/insta-compressed.mp4" 
                            autoPlay 
                            muted 
                            loop 
                            playsInline
                            className="w-full h-full object-cover"
                            style={{ 
                              objectFit: "cover",
                              objectPosition: "center",
                              willChange: "transform"
                            }}
                          />
                        </div>
                        
                        {/* UI overlay with Instagram-like interface */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent">
                          {/* Instagram header */}
                          <div className="absolute top-0 inset-x-0 bg-black/10 backdrop-blur-sm p-3 flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <div className="relative w-6 h-6 flex items-center justify-center">
                                <div className="absolute inset-0 bg-white rounded-full"></div>
                                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-xs">B</span>
                              </div>
                              <span className="text-white text-xs font-medium">boostly_app</span>
                            </div>
                            <motion.div 
                              className="flex items-center space-x-2"
                              animate={{ opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="text-white text-xs">Live Demo</span>
                            </motion.div>
                          </div>
                          
                          {/* Floating interaction bubbles */}
                          <motion.div
                            className="absolute right-4 top-1/4 bg-white/10 backdrop-blur-md rounded-lg p-2 shadow-lg border border-white/20"
                            animate={{ 
                              y: [0, -10, 0],
                              scale: [1, 1.05, 1]
                            }}
                            transition={{ 
                              duration: 4, 
                              repeat: Infinity,
                              repeatType: "reverse" 
                            }}
                          >
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="w-4 h-4 text-blue-400" />
                              <span className="text-white text-xs">New message</span>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Laptop base */}
                    <div className="relative h-[20px] bg-gray-800 rounded-b-xl mx-auto" style={{ width: '95%' }}>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/4 h-1 bg-gray-700 rounded-t-sm"></div>
                    </div>
                    
                    {/* Laptop shadow */}
                    <div className="absolute -bottom-6 inset-x-0 h-6 bg-gradient-to-b from-black/50 to-transparent rounded-full blur-md"></div>
                  </div>
                  
                  {/* Static interactive elements floating around the laptop */}
                  <motion.div
                    className="absolute -right-10 top-1/3 bg-white/10 backdrop-blur-md rounded-lg p-3 shadow-lg border border-white/20"
                    animate={{ 
                      y: [0, -15, 0],
                      rotate: [0, 5, 0]
                    }}
                    transition={{ 
                      duration: 5, 
                      repeat: Infinity,
                      repeatType: "reverse" 
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                      <span className="text-white text-xs">Auto-reply activated</span>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    className="absolute -left-10 top-1/2 bg-white/10 backdrop-blur-md rounded-lg p-3 shadow-lg border border-white/20"
                    animate={{ 
                      y: [0, 15, 0],
                      rotate: [0, -5, 0]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: 0.5
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <Heart className="w-5 h-5 text-red-400" />
                      <span className="text-white text-xs">+28% engagement</span>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    className="absolute -bottom-5 left-1/4 bg-white/10 backdrop-blur-md rounded-lg p-3 shadow-lg border border-white/20"
                    animate={{ 
                      y: [0, 10, 0],
                      x: [0, 5, 0]
                    }}
                    transition={{ 
                      duration: 6, 
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: 1
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                      <span className="text-white text-xs">AI-powered responses</span>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
            
            <motion.div 
              className="flex justify-center mt-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
            >
              <motion.a 
                href="#features" 
                className="text-blue-300 flex flex-col items-center"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="mb-2 text-sm">Scroll to explore</span>
                <ChevronDown className="w-5 h-5" />
              </motion.a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium">
                Features
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tighter sm:text-5xl">
                Powerful Instagram Automation
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Everything you need to grow your Instagram presence and convert followers into customers
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Smart Responses",
                description: "AI-powered responses that feel personal and authentic to each follower",
                icon: <Sparkles className="w-6 h-6" />
              },
              {
                title: "Engagement Tracking",
                description: "Track and analyze your engagement metrics to optimize your strategy",
                icon: <Zap className="w-6 h-6" />
              },
              {
                title: "Automated Workflows",
                description: "Create custom workflows that trigger based on specific user actions",
                icon: <CheckCircle className="w-6 h-6" />
              }
            ].map((feature, index) => (
              <RevealOnScroll key={index} delay={index * 0.1}>
                <Card className="border border-blue-900/30 bg-blue-950/20 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300">
                  <CardHeader>
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 w-fit">
                      {feature.icon}
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Glassmorphism Section with Blur Effect */}
      <GlassmorphismSection />
      {/* Horizontal Scrolling Section */}
      <section className="relative bg-gradient-to-b from-slate-950 to-slate-900 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] z-0" />
        
        <div className="container mx-auto px-4 mb-16 relative z-10">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium">
                How It Works
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tighter sm:text-5xl">
                Simple Yet Powerful
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                See how Boostly transforms your Instagram engagement in three easy steps
              </p>
            </div>
          </RevealOnScroll>
        </div>
        
        <HorizontalScroll>
          {([
            {
              title: "Connect",
              description: "Link your Instagram account with just a few clicks",
              icon: <Instagram className="w-8 h-8" />,
              color: "from-blue-500 to-blue-600",
              image: "/Ig-creators.png",
              animation: {
                type: "pulse" as const,
                elements: [
                  { top: "20%", left: "20%", size: "w-8 h-8", color: "bg-blue-400/30", delay: 0 },
                  { top: "70%", left: "80%", size: "w-6 h-6", color: "bg-blue-300/20", delay: 0.5 },
                  { top: "40%", left: "70%", size: "w-4 h-4", color: "bg-blue-500/20", delay: 1 }
                ]
              }
            },
            {
              title: "Configure",
              description: "Set up your automation triggers and responses",
              icon: <Zap className="w-8 h-8" />,
              color: "from-purple-500 to-purple-600",
              image: "/Ig-creators.png",
              animation: {
                type: "orbit" as const,
                elements: [
                  { radius: 60, speed: 15, size: "w-3 h-3", color: "bg-purple-400/40" },
                  { radius: 40, speed: 10, size: "w-2 h-2", color: "bg-purple-300/30" },
                  { radius: 80, speed: 20, size: "w-4 h-4", color: "bg-purple-500/20" }
                ]
              }
            },
            {
              title: "Automate",
              description: "Let Boostly handle your engagement automatically",
              icon: <MessageSquare className="w-8 h-8" />,
              color: "from-pink-500 to-pink-600",
              image: "/Ig-creators.png",
              animation: {
                type: "float" as const,
                elements: [
                  { top: "30%", left: "20%", size: "w-10 h-10", color: "bg-pink-400/20", duration: 3 },
                  { top: "60%", left: "70%", size: "w-8 h-8", color: "bg-pink-300/15", duration: 4 },
                  { top: "20%", left: "60%", size: "w-6 h-6", color: "bg-pink-500/25", duration: 5 }
                ]
              }
            },
            {
              title: "Analyze",
              description: "Track your performance with detailed analytics",
              icon: <CheckCircle className="w-8 h-8" />,
              color: "from-green-500 to-green-600",
              image: "/Ig-creators.png",
              animation: {
                type: "wave" as const,
                elements: [
                  { width: "w-16", height: "h-1", color: "bg-green-400/30", delay: 0 },
                  { width: "w-12", height: "h-1", color: "bg-green-300/20", delay: 0.2 },
                  { width: "w-20", height: "h-1", color: "bg-green-500/20", delay: 0.4 }
                ]
              }
            },
            {
              title: "Scale",
              description: "Grow your audience and business effortlessly",
              icon: <ArrowRight className="w-8 h-8" />,
              color: "from-yellow-500 to-yellow-600",
              image: "/Ig-creators.png",
              animation: {
                type: "expand" as const,
                elements: [
                  { size: "w-16 h-16", color: "bg-yellow-400/10", delay: 0 },
                  { size: "w-24 h-24", color: "bg-yellow-300/5", delay: 0.5 },
                  { size: "w-32 h-32", color: "bg-yellow-500/5", delay: 1 }
                ]
              }
            }
          ] as CardStep[]).map((step, index) => (
            <motion.div 
              key={index} 
              className="flex-shrink-0 w-[400px] h-[500px] mx-8 rounded-2xl overflow-hidden relative group"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 15 
              }}
            >
              {/* Glassmorphism effect */}
              <div className="absolute inset-0 backdrop-blur-md bg-black/20 z-0"></div>
              
              {/* Card background with gradient overlay */}
              <div className="absolute inset-0 z-0">
                <Image 
                  src={step.image} 
                  alt={step.title}
                  fill
                  className="object-cover"
                />
                <motion.div 
                  className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-80`}
                  whileHover={{ opacity: 0.7 }}
                  transition={{ duration: 0.3 }}
                ></motion.div>
                
                {/* Mesh gradient overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]"></div>
              </div>

              {/* Card content */}
              <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                <div className="space-y-6">
                  <motion.div 
                    className="p-4 bg-white/10 backdrop-blur-md rounded-xl w-fit"
                    whileHover={{ 
                      scale: 1.1, 
                      backgroundColor: "rgba(255, 255, 255, 0.2)" 
                    }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {step.icon}
                  </motion.div>
                  
                  <motion.div
                    initial={{ y: 0 }}
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <h3 className="text-3xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-lg text-white/80">{step.description}</p>
                  </motion.div>
                </div>
                
                {/* Learn more button */}
                <motion.div
                  className="mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.button
                    className="group flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </motion.div>
              </div>

              {/* Animated elements based on animation type */}
              {step.animation.type === "pulse" && (
                <>
                  {step.animation.elements.map((el, i) => (
                    <motion.div
                      key={i}
                      className={`absolute rounded-full ${el.size} ${el.color}`}
                      style={{ top: el.top, left: el.left }}
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        delay: el.delay
                      }}
                    />
                  ))}
                </>
              )}

              {step.animation.type === "orbit" && (
                <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
                  {step.animation.elements.map((el, i) => (
                    <motion.div
                      key={i}
                      className={`absolute ${el.size} ${el.color} rounded-full`}
                      animate={{
                        x: Array.from({ length: 20 }).map((_, i) => 
                          Math.cos(i / 19 * Math.PI * 2) * el.radius
                        ),
                        y: Array.from({ length: 20 }).map((_, i) => 
                          Math.sin(i / 19 * Math.PI * 2) * el.radius
                        )
                      }}
                      transition={{
                        duration: el.speed,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  ))}
                </div>
              )}

              {step.animation.type === "float" && (
                <>
                  {step.animation.elements.map((el, i) => (
                    <motion.div
                      key={i}
                      className={`absolute rounded-full ${el.size} ${el.color} blur-sm`}
                      style={{ top: el.top, left: el.left }}
                      animate={{ y: [0, -20, 0] }}
                      transition={{ 
                        duration: el.duration, 
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    />
                  ))}
                </>
              )}

              {step.animation.type === "wave" && (
                <div className="absolute bottom-24 left-0 right-0 flex flex-col items-center space-y-2">
                  {step.animation.elements.map((el, i) => (
                    <motion.div
                      key={i}
                      className={`${el.width} ${el.height} ${el.color} rounded-full`}
                      animate={{
                        scaleX: [1, 1.5, 1],
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        delay: el.delay
                      }}
                    />
                  ))}
                </div>
              )}

              {step.animation.type === "expand" && (
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  {step.animation.elements.map((el, i) => (
                    <motion.div
                      key={i}
                      className={`absolute rounded-full ${el.size} ${el.color}`}
                      animate={{
                        scale: [0.8, 1, 0.8],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity,
                        delay: el.delay
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Card number */}
              <div className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-bold text-xl border border-white/20">
                {index + 1}
              </div>
              
              {/* Card shine effect on hover */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"
              ></motion.div>
            </motion.div>
          ))}
        </HorizontalScroll>
      </section>

      {/* Results Dashboard Section */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] z-0" />
        
        <div className="container mx-auto px-4 relative z-10">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium">
                Real Results
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tighter sm:text-5xl">
                See Your Growth in Real-Time
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Track your Instagram engagement metrics with our powerful analytics dashboard
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Dashboard visualization */}
            <RevealOnScroll delay={0.2}>
              <div className="relative">
                {/* Dashboard frame */}
                <div className="relative rounded-xl overflow-hidden border border-blue-500/20 shadow-2xl bg-slate-900/80 backdrop-blur-sm">
                  {/* Dashboard header */}
                  <div className="bg-slate-800/50 px-6 py-4 border-b border-blue-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-sm font-medium text-blue-300">Boostly Analytics Dashboard</div>
                    <div className="text-sm text-blue-400">
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        Live Data
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Dashboard content */}
                  <div className="p-6">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[
                        { label: "Total Engagements", value: "14,582", change: "+24%", color: "text-blue-400" },
                        { label: "Response Rate", value: "92%", change: "+12%", color: "text-green-400" },
                        { label: "New Followers", value: "1,247", change: "+18%", color: "text-purple-400" }
                      ].map((stat, i) => (
                        <motion.div 
                          key={i}
                          className="bg-slate-800/50 rounded-lg p-4 border border-blue-500/10"
                          whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)" }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <p className="text-sm text-blue-200 mb-1">{stat.label}</p>
                          <div className="flex items-end justify-between">
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-green-400 flex items-center">
                              <ArrowRight className="w-3 h-3 rotate-45 mr-1" />
                              {stat.change}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Chart */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-blue-500/10 mb-6 h-48 relative overflow-hidden">
                      <p className="text-sm text-blue-200 mb-3">Engagement Growth</p>
                      
                      {/* Animated chart */}
                      <div className="absolute bottom-4 left-4 right-4 h-32">
                        {/* Chart grid lines */}
                        <div className="absolute inset-0 grid grid-rows-4 gap-8">
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="border-t border-blue-500/10"></div>
                          ))}
                        </div>
                        
                        {/* Chart line */}
                        <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <motion.path
                            d="M0,50 C10,45 20,60 30,40 C40,20 50,30 60,25 C70,20 80,10 90,5 L100,0"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="2"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, delay: 0.5 }}
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        
                        {/* Data points */}
                        {[
                          { x: "0%", y: "50%" },
                          { x: "20%", y: "60%" },
                          { x: "40%", y: "20%" },
                          { x: "60%", y: "25%" },
                          { x: "80%", y: "10%" },
                          { x: "95%", y: "5%" }
                        ].map((point, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-3 h-3 bg-purple-500 rounded-full"
                            style={{ left: point.x, bottom: point.y }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5 + (i * 0.2) }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Recent activities */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-blue-500/10">
                      <p className="text-sm text-blue-200 mb-3">Recent Activities</p>
                      <div className="space-y-3">
                        {[
                          { icon: <MessageSquare className="w-4 h-4" />, text: "New comment response triggered", time: "2m ago", color: "bg-blue-500" },
                          { icon: <Heart className="w-4 h-4" />, text: "Engagement milestone reached", time: "1h ago", color: "bg-pink-500" },
                          { icon: <Share2 className="w-4 h-4" />, text: "Content shared by @user123", time: "3h ago", color: "bg-green-500" }
                        ].map((activity, i) => (
                          <motion.div 
                            key={i}
                            className="flex items-center gap-3 text-sm"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1 + (i * 0.2) }}
                          >
                            <div className={`p-2 rounded-full ${activity.color}/20`}>
                              <div className={`p-1 rounded-full ${activity.color}`}>
                                {activity.icon}
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-blue-100">{activity.text}</p>
                              <p className="text-xs text-blue-400">{activity.time}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <motion.div 
                  className="absolute -top-6 -right-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3] 
                  }}
                  transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div 
                  className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3] 
                  }}
                  transition={{ duration: 8, repeat: Infinity, delay: 2 }}
                />
              </div>
            </RevealOnScroll>
            
            {/* Features list */}
            <div>
              <RevealOnScroll delay={0.4}>
                <div className="space-y-8">
                  {[
                    {
                      title: "Comprehensive Analytics",
                      description: "Track all your key metrics in one place with our intuitive dashboard",
                      icon: <CheckCircle className="w-5 h-5 text-green-400" />
                    },
                    {
                      title: "Real-time Monitoring",
                      description: "See engagement happen as it occurs with live data updates",
                      icon: <Zap className="w-5 h-5 text-yellow-400" />
                    },
                    {
                      title: "Growth Insights",
                      description: "Identify trends and patterns to optimize your Instagram strategy",
                      icon: <ArrowRight className="w-5 h-5 text-blue-400" />
                    },
                    {
                      title: "Performance Reports",
                      description: "Get detailed weekly reports delivered straight to your inbox",
                      icon: <Sparkles className="w-5 h-5 text-purple-400" />
                    }
                  ].map((feature, index) => (
                    <motion.div 
                      key={index}
                      className="flex gap-4"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.6 + (index * 0.2) }}
                    >
                      <div className="p-2 rounded-lg bg-blue-500/10 h-fit">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                        <p className="text-blue-200">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </RevealOnScroll>
              
              <RevealOnScroll delay={0.8}>
                <div className="mt-8">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transform hover:scale-105 transition-all shadow-lg"
                  >
                    <Link href="/dashboard" className="flex items-center gap-2">
                      Explore Dashboard
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section with 3D Cards */}
      <section id="testimonials" className="py-24 bg-gradient-to-b from-slate-950 to-slate-900 relative">
        <div className="container mx-auto px-4">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium">
                Testimonials
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tighter sm:text-5xl">
                What Our Users Say
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Join thousands of creators who have transformed their Instagram engagement
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <RevealOnScroll key={index} delay={index * 0.1}>
                <div className="h-full">
                  <Card3D>
                    <Card className="border border-blue-900/30 bg-blue-950/20 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 h-full">
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                            {testimonial.avatar}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                            <CardDescription>{testimonial.role}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground italic">&ldquo;{testimonial.content}&rdquo;</p>
                      </CardContent>
                      
                      {/* Shine effect */}
                      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-lg"></div>
                      </div>
                    </Card>
                  </Card3D>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section with Parallax */}
      <section id="pricing" className="container w-full py-24 md:py-32 lg:py-40 bg-background relative">
        <ParallaxSection speed={-0.2}>
          <FloatingElement offset={15} duration={4}>
            <div className="absolute top-20 right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
          </FloatingElement>
        </ParallaxSection>

        <div className="container px-4 md:px-6">
          <RevealOnScroll>
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium">
                Pricing Plans
              </span>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Choose Your Plan
              </h2>
              <p className="max-w-[900px] text-muted-foreground">
                Select the perfect plan to boost your Instagram engagement
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 gap-8 mt-8 md:grid-cols-2 md:gap-12">
            {plans.map((plan, index) => (
              <RevealOnScroll key={index} delay={index * 0.2}>
                <Card className="flex flex-col justify-between h-full transform hover:scale-105 transition-all duration-300 relative overflow-hidden group border border-blue-900/30 hover:border-blue-500/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                        {plan.icon}
                      </div>
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="text-4xl font-bold">
                      {plan.price}
                      <span className="text-lg font-normal text-muted-foreground">
                        /month
                      </span>
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <motion.li
                          key={i}
                          className="flex items-center"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <CheckCircle className="mr-3 h-5 w-5 text-blue-500" />
                          <span className="text-sm text-muted-foreground">
                            {feature}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full hover:scale-105 transition-transform bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 shadow-lg">
                      {plan.cta}
                    </Button>
                  </CardFooter>
                </Card>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-blue-900 relative">
        <div className="container mx-auto px-4 text-center">
          <RevealOnScroll>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-6">
              Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Boost</span> Your Instagram?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-blue-200 mb-8">
              Join thousands of creators who are transforming their Instagram engagement with Boostly
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transform hover:scale-105 transition-all shadow-lg"
              >
                <Link href="/dashboard" className="flex items-center gap-2">
                  Get Started Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <DirectDemoLogin 
                variant="secondary"
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium transform hover:scale-105 transition-all shadow-lg"
              />
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <div className="relative h-8 w-8 flex items-center justify-center group">
                {/* Glowing background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                
                {/* White circular background */}
                <div className="absolute inset-0 bg-white rounded-lg"></div>
                
                {/* Logo letter with gradient */}
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-lg">B</span>
                
                {/* Subtle ring */}
                <div className="absolute inset-0 border border-white/30 rounded-lg"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white tracking-tight">
                  Boostly
                </span>
                <span className="text-xs text-blue-300 -mt-1">Instagram Automation</span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 md:gap-12 text-sm text-blue-200">
              {["Features", "Pricing", "About", "Contact", "Privacy", "Terms"].map((item, i) => (
                <Link key={i} href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors">
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-blue-900/30 text-center text-sm text-blue-300/60">
            © {new Date().getFullYear()} Boostly. All rights reserved.
          </div>
        </div>
      </footer>
      
      <ChatbotIframe />

      
    </main>
  );
}