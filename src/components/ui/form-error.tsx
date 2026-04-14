"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface FormErrorProps {
  message?: string;
  className?: string;
  animated?: boolean;
  id?: string;
}

export function FormError({
  message,
  className = "",
  animated = true,
  id,
}: FormErrorProps) {
  if (!message) return null;

  const content = (
    <div
      id={id}
      className={`flex items-center gap-2 font-mono text-xs text-red-400 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );

  if (animated) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
  }

  return content;
}

export function FieldError({
  message,
  fieldId,
}: {
  message?: string;
  fieldId: string;
}) {
  if (!message) return null;
  return <FormError message={message} id={`${fieldId}-error`} className="mt-2" />;
}

export default FormError;
