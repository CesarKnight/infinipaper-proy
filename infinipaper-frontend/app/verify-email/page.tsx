"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = React.useState<"loading" | "ok" | "error">(
    token ? "loading" : "error",
  );
  const [message, setMessage] = React.useState(
    token ? "Confirmando tu correo…" : "Falta el token de confirmación.",
  );

  React.useEffect(() => {
    if (!token) {
      return;
    }
    let cancelled = false;
    apiFetch("/auth/email/verify/confirm", {
      method: "POST",
      body: { token },
    })
      .then(() => {
        if (cancelled) return;
        setState("ok");
        setMessage("Correo confirmado. Ya puedes solicitar la verificación docente.");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState("error");
        setMessage(
          error instanceof ApiError ? error.message : "No se pudo confirmar.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Confirmación de correo</CardTitle>
          <CardDescription>Verificación de tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p
            className={
              state === "error"
                ? "text-sm text-destructive"
                : "text-sm text-muted-foreground"
            }
          >
            {message}
          </p>
          <Button render={<Link href={state === "ok" ? "/profile" : "/login"} />}>
            {state === "ok" ? "Ir a mi perfil" : "Volver al inicio"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={<main className="p-8">Cargando…</main>}>
      <VerifyEmailContent />
    </React.Suspense>
  );
}
