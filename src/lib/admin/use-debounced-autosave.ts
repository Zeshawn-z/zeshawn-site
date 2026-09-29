"use client";

import { useEffect, useRef } from "react";

export function useDebouncedAutosave(
  key: string | null,
  enabled: boolean,
  save: () => Promise<unknown>,
  delay = 1200
) {
  const attemptedKey = useRef<string | null>(null);
  const lastKey = useRef<string | null>(key);
  const saveRef = useRef(save);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (lastKey.current !== key) {
      attemptedKey.current = null;
      lastKey.current = key;
    }
  }, [key]);

  useEffect(() => {
    if (!enabled || !key || attemptedKey.current === key) return;
    const timer = window.setTimeout(() => {
      attemptedKey.current = key;
      void saveRef.current();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [key, enabled, delay]);

  useEffect(() => {
    if (!key) return;
    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [key]);

  return () => {
    attemptedKey.current = key;
  };
}
