"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRightIcon, UserPlusIcon } from "lucide-react";
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
  username: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Solo letras, números, _, . y -"),
  email: z.string().email("Correo inválido"),
  displayName: z.string().min(1, "Ingresa tu nombre"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      email: "",
      displayName: "",
      password: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await apiFetch("/auth/register", { method: "POST", body: values });
      toast.success(
        "Cuenta creada. Revisa tu correo para confirmar tu dirección.",
      );
      router.replace("/profile");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "No se pudo registrar";
      toast.error(message);
    }
  }

  return (
    <AuthShell>
      <AuthCard
        icon={<UserPlusIcon className="size-5" />}
        title="Crea tu cuenta"
        description="Únete para organizar tus proyectos y apuntes en un solo lugar."
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(form.formState.errors.displayName)}>
              <FieldLabel htmlFor="displayName">Nombre</FieldLabel>
              <Input
                id="displayName"
                autoComplete="name"
                placeholder="Ana García"
                aria-invalid={Boolean(form.formState.errors.displayName)}
                aria-describedby={
                  form.formState.errors.displayName
                    ? "displayName-error"
                    : undefined
                }
                className="h-11 rounded-xl bg-background/60 px-3 text-base md:text-sm"
                {...form.register("displayName")}
              />
              <FieldError
                id="displayName-error"
                className="text-xs"
                errors={[form.formState.errors.displayName]}
              />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.username)}>
              <FieldLabel htmlFor="username">Usuario</FieldLabel>
              <Input
                id="username"
                autoComplete="username"
                placeholder="ana.garcia"
                aria-invalid={Boolean(form.formState.errors.username)}
                aria-describedby={
                  form.formState.errors.username
                    ? "username-error"
                    : undefined
                }
                className="h-11 rounded-xl bg-background/60 px-3 text-base md:text-sm"
                {...form.register("username")}
              />
              <FieldError
                id="username-error"
                className="text-xs"
                errors={[form.formState.errors.username]}
              />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.email)}>
              <FieldLabel htmlFor="email">Correo</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="ana@ejemplo.com"
                aria-invalid={Boolean(form.formState.errors.email)}
                aria-describedby={
                  form.formState.errors.email ? "email-error" : undefined
                }
                className="h-11 rounded-xl bg-background/60 px-3 text-base md:text-sm"
                {...form.register("email")}
              />
              <FieldError
                id="email-error"
                className="text-xs"
                errors={[form.formState.errors.email]}
              />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.password)}>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
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
            {form.formState.isSubmitting ? "Creando…" : "Crear cuenta"}
            {form.formState.isSubmitting ? null : (
              <ArrowRightIcon data-icon="inline-end" />
            )}
          </Button>
        </form>

        <p className="mt-6 border-t border-border/70 pt-5 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
