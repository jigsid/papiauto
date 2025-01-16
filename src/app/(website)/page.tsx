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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, ReactNode } from "react";

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

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

  return (
    <main className="relative overflow-hidden">
      {/* Animated background gradient */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 opacity-30"
        style={{
          transform: `translate(${mousePosition.x * 0.02}px, ${
            mousePosition.y * 0.02
          }px)`,
        }}
      />

      <section className="relative min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-bg">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingElement offset={30} duration={4}>
            <div className="absolute top-20 left-20 w-20 h-20 bg-blue-500/10 rounded-full blur-xl" />
          </FloatingElement>
          <FloatingElement offset={25} duration={3.5}>
            <div className="absolute top-40 right-40 w-32 h-32 bg-purple-500/10 rounded-full blur-xl" />
          </FloatingElement>
          <FloatingElement offset={20} duration={5}>
            <div className="absolute bottom-40 left-1/3 w-24 h-24 bg-pink-500/10 rounded-full blur-xl" />
          </FloatingElement>
        </div>

        <div className="relative">
          <div className="container px-4 py-6 md:py-8">
            <div className="flex items-center justify-between">
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="h-8 w-8 rounded-lg bg-white flex items-center justify-center font-bold"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  li
                </motion.div>
                <span className="text-xl font-semibold text-primary-foreground">
                  Slide
                </span>
              </motion.div>

              <nav
                className={`${
                  isMenuOpen ? "block" : "hidden"
                } absolute top-20 left-0 right-0 bg-slate-900/95 p-4 md:relative md:top-0 md:bg-transparent md:p-0 md:block backdrop-blur-lg md:backdrop-blur-none z-50`}
              >
                <motion.div
                  className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-6 text-sm text-blue-200"
                  variants={staggerChildren}
                  initial="initial"
                  animate="animate"
                >
                  {["Features", "Pricing", "About"].map((item, i) => (
                    <motion.div
                      key={i}
                      variants={fadeInUp}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Link
                        href={`#${item.toLowerCase()}`}
                        className="hover:text-white transition-colors relative group"
                      >
                        {item}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full" />
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
                    <Button className="bg-white text-primary hover:bg-blue-50 transition-all group relative overflow-hidden">
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

            <div className="mx-auto mt-16 max-w-3xl text-center relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute -top-20 -right-20 text-blue-500/20"
              >
                <Instagram className="w-40 h-40" />
              </motion.div>

              <motion.h1
                className="text-4xl font-bold leading-tight tracking-tighter text-white sm:text-5xl md:text-6xl lg:text-7xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                Transform Your Instagram Engagement with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Slide
                </span>
              </motion.h1>

              <motion.p
                className="mt-6 text-lg text-blue-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                Slide revolutionizes how you connect with your audience on
                Instagram. Automate responses and boost engagement effortlessly,
                turning interactions into valuable business opportunities.
              </motion.p>

              <motion.div
                className="mt-8 flex flex-col sm:flex-row justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
              >
                <Button
                  size="lg"
                  className="bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 transition-all group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-blue-400 hover:bg-blue-900/50 transform hover:scale-105 transition-all"
                >
                  Learn More
                </Button>
              </motion.div>
            </div>

            <motion.div
              className="relative h-40 md:h-80 w-full mt-10 rounded-lg overflow-hidden"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10" />
              <Image
                src="/Ig-creators.png"
                alt="Community member"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="container w-full py-12 md:py-24 lg:py-32 bg-background relative">
        <FloatingElement offset={15} duration={4}>
          <div className="absolute top-20 right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
        </FloatingElement>

        <div className="container px-4 md:px-6">
          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium">
              Pricing Plans
            </span>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Choose Your Plan
            </h2>
            <p className="max-w-[900px] text-muted-foreground">
              Select the perfect plan to boost your Instagram engagement
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2 md:gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <Card className="flex flex-col justify-between h-full transform hover:scale-105 transition-all duration-300 relative overflow-hidden group">
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
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <motion.li
                          key={i}
                          className="flex items-center"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                          <span className="text-sm text-muted-foreground">
                            {feature}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full hover:scale-105 transition-transform bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90">
                      {plan.cta}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
