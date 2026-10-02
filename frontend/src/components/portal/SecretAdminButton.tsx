"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { secretLoginAction } from "@/app/admin/actions/auth";
import { IdInput, PasswordInput } from "@/components/portal/LoginFields";

export function SecretAdminButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(false);
    const res = await secretLoginAction(id, password);
    // On success the action redirects, so we only get here on failure.
    if (res?.error) {
      setError(true);
      setLoading(false);
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
                <form onSubmit={submit} className="flex flex-col gap-3 p-4">
                  <IdInput
                    autoFocus
                    value={id}
                    onChange={(v) => { setId(v); setError(false); }}
                    disabled={loading}
                    className="w-full rounded-2xl bg-white/5 px-5 py-4 text-center text-xl font-light tracking-[0.12em] text-white outline-none placeholder:text-white/30 placeholder:tracking-normal"
                  />
                  <PasswordInput
                    value={password}
                    onChange={(v) => { setPassword(v); setError(false); }}
                    disabled={loading}
                    className="w-full rounded-2xl bg-white/5 px-5 py-4 text-center text-xl font-light tracking-[0.12em] text-white outline-none placeholder:text-white/30 placeholder:tracking-normal [&:-webkit-autofill]:[-webkit-text-fill-color:#fff] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_rgba(255,255,255,0.05)]"
                  />
                  {error && <p className="text-center text-sm font-semibold text-red-400">Incorrect ID or password.</p>}
                  <button type="submit" disabled={loading || !id || !password} className="mt-1 rounded-2xl bg-white/90 py-3.5 text-sm font-bold uppercase tracking-[0.25em] text-black transition-opacity disabled:opacity-40">
                    Enter
                  </button>
                </form>
                
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
