"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { secretLoginAction } from "@/app/admin/actions/auth";

export function SecretAdminButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();
    setCode(val);
    setError(false);

    if (val === "bookends") {
      setLoading(true);
      const res = await secretLoginAction(val);
      if (res?.error) {
        setError(true);
        setLoading(false);
      }
    }
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-50 sm:top-6 sm:right-6">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              key="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition-colors hover:bg-black/40 border border-white/10 shadow-lg"
              aria-label="Admin Access"
            >
              <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(40px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
            onClick={() => {
              if (!loading) setIsOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
              className="relative w-full max-w-md px-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/20 p-2 shadow-2xl ring-1 ring-black/5">
                <input
                  autoFocus
                  type="password"
                  placeholder="Enter access code..."
                  value={code}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full bg-transparent px-6 py-5 text-center text-3xl font-light tracking-[0.2em] text-white outline-none placeholder:text-white/20 placeholder:tracking-normal ${error ? 'text-red-400' : ''}`}
                />
                
                {loading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-3xl"
                  >
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                  </motion.div>
                )}
              </div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-center text-xs font-semibold tracking-[0.3em] text-white uppercase"
              >
                Restricted Area
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
