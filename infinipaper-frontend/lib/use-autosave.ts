"use client";

import * as React from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutosaveOptions {
  value: string;
  initial: string;
  enabled?: boolean;
  delay?: number;
  onSave: (value: string) => Promise<unknown>;
}

/**
 * Autoguardado con debounce. No guarda si el valor no cambió respecto al
 * último guardado (evita peticiones al montar el editor).
 */
export function useAutosave({
  value,
  initial,
  enabled = true,
  delay = 1200,
  onSave,
}: UseAutosaveOptions): AutosaveStatus {
  const [status, setStatus] = React.useState<AutosaveStatus>("idle");
  const lastSaved = React.useRef(initial);
  const onSaveRef = React.useRef(onSave);

  React.useEffect(() => {
    onSaveRef.current = onSave;
  });

  // Si el contenido inicial cambia (p. ej. se recarga el recurso), sincroniza.
  React.useEffect(() => {
    lastSaved.current = initial;
  }, [initial]);

  React.useEffect(() => {
    if (!enabled) return;
    if (value === lastSaved.current) return;

    const timeout = setTimeout(async () => {
      setStatus("saving");
      try {
        await onSaveRef.current(value);
        lastSaved.current = value;
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, enabled, delay]);

  return status;
}
