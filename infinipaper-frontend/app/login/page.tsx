"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRightIcon, ShieldCheckIcon } from "lucide-react";
import { AuthCard, AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { apiFetch, ApiError } from "@/lib/api";

const schema = z.object({
  identifier: z.string().min(3, "Ingresa tu correo o usuario"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      await apiFetch("/auth/login", { method: "POST", body: values });
      toast.success("Bienvenido");
      router.replace(params.get("next") ?? "/");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "No se pudo iniciar sesión";
      toast.error(message);
    }
  }

  return (
    <AuthShell>
      <AuthCard
        icon={<ShieldCheckIcon className="size-5" />}
        title="Bienvenido de nuevo"
        description="Entra para continuar con tus proyectos, apuntes y material de estudio."
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(form.formState.errors.identifier)}>
              <FieldLabel htmlFor="identifier">Correo o usuario</FieldLabel>
              <Input
                id="identifier"
                autoComplete="username"
                placeholder="ana@ejemplo.com"
                aria-invalid={Boolean(form.formState.errors.identifier)}
                aria-describedby={
                  form.formState.errors.identifier
                    ? "identifier-error"
                    : undefined
                }
                className="h-11 rounded-xl bg-background/60 px-3 text-base md:text-sm"
                {...form.register("identifier")}
              />
              <FieldError
                id="identifier-error"
                className="text-xs"
                errors={[form.formState.errors.identifier]}
              />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.password)}>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Tu contraseña"
                aria-invalid={Boolean(form.formState.errors.password)}
                aria-describedby={
                  form.formState.errors.password
                    ? "password-error"
                    : undefined
                }
                className="h-11 rounded-xl bg-background/60 px-3 text-base md:text-sm"
                {...form.register("password")}
              />
              <FieldError
                id="password-error"
                className="text-xs"
                errors={[form.formState.errors.password]}
              />
            </Field>
          </FieldGroup>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="mt-1 h-11 w-full rounded-xl text-sm font-semibold shadow-lg shadow-primary/20"
          >
            {form.formState.isSubmitting ? "Entrando…" : "Entrar"}
            {form.formState.isSubmitting ? null : (
              <ArrowRightIcon data-icon="inline-end" />
            )}
          </Button>
        </form>

        <p className="mt-6 border-t border-border/70 pt-5 text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Crea una cuenta
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
