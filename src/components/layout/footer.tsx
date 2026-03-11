"use client";

import { Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/30 mt-auto">
      <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span>Meet the Developer</span>
        <span className="opacity-30">·</span>
        <a
          href="https://www.linkedin.com/in/kushagra-joshi2707/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Linkedin className="h-3.5 w-3.5" />
          LinkedIn
        </a>
        <a
          href="mailto:joshikushagra704@gmail.com"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true" fill="currentColor">
            <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
          Gmail
        </a>
      </div>
    </footer>
  );
}
