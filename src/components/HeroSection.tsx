import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRightOutlined } from "@ant-design/icons";
import { Button } from "~/components/ui/button";

export default function HeroSection() {
  const [isHovered, setIsHovered] = useState(false);
  const canvasRef = useRef(null);

  return (
    <div className="relative overflow-hidden bg-background pb-16">
      <div className="bg-[#312E2D] p-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="text-orange-400">Automate.</span>{" "}
              <span className="text-blue-500">Visualize.</span>{" "}
              <span className="text-violet-500">Optimize.</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p className="mt-6 text-lg text-white md:text-xl">
              Design and manage workflows effortlessly with Flow Editor – a
              drag-and-drop automation builder for seamless task execution,
              decision-making, and process optimization.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
          >
            <Button
              variant={"secondary"}
              size="lg"
              className="bg-white font-semibold"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => {
                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: "smooth",
                });
              }}
            >
              Get Started
              <motion.span
                animate={{ x: isHovered ? 5 : 0 }}
                transition={{ duration: 0.2 }}
                className="ml-2"
              >
                <ArrowRightOutlined style={{ fontSize: 16 }} />
              </motion.span>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
