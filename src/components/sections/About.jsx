import React from "react";
import { motion } from "framer-motion";
import { about } from "../../data/content";
import Reveal from "../ui-custom/Reveal";

export default function About() {
  return (
    <section id="about" data-testid="about-section" className="relative min-h-[100svh] flex items-center py-12 sm:py-8 md:py-20">
      <div className="container-x grid sm:grid-cols-12 gap-y-8 sm:gap-x-0 items-center w-full">
        <motion.figure
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="about-portrait-wrap sm:col-span-4 md:col-span-5"
        >
          <div className="about-portrait">
            <img
              src="/rahul-headshot.webp?v=1"
              alt="Rahul Madhav Deshpande"
              decoding="async"
              sizes="(min-width: 768px) 38vw, 100vw"
            />
          </div>
        </motion.figure>

        <div className="sm:col-span-8 md:col-span-7">
          <Reveal as="h2" className="h-section text-text">About <span className="accent-word">me</span></Reveal>
          <div className="about-copy mt-5 md:mt-7 space-y-3.5 md:space-y-5 max-w-[44rem]">
            {about.paragraphs.map((paragraph, index) => (
              <Reveal key={paragraph} as="p" delay={index * 0.08} className="p-body about-paragraph">
                {paragraph}
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
