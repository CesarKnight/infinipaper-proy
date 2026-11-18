"use client";

import * as React from "react";

export function ViewerShell({
  title,
  subtitle,
  badge,
  actions,
  children,
  footer,
  contentClassName = "",
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-muted/35 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          {badge ? (
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              {badge}
            </p>
          ) : null}
          <h2 className="truncate font-heading text-lg font-semibold">{title}</h2>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      <div className={`bg-paper-sunken/45 p-3 dark:bg-night/25 sm:p-5 ${contentClassName}`}>
        {children}
      </div>
      {footer ? (
        <footer className="border-t border-border/70 px-4 py-2 text-xs text-muted-foreground sm:px-5">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}

export function ViewerEmpty({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/60 p-6 text-center">
      <p className="font-heading text-lg font-semibold">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
