"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api";
import type { McpToken } from "@/lib/types";

export function McpTokensCard({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [createdToken, setCreatedToken] = React.useState<string | null>(null);

  const tokens = useQuery({
    queryKey: ["mcp-tokens", projectId],
    queryFn: () => apiFetch<McpToken[]>(`/projects/${projectId}/mcp-tokens`),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch<McpToken>(`/projects/${projectId}/mcp-tokens`, {
        method: "POST",
        body: {
          name,
          scopes: ["performance:read"],
          expiresAt: expiresAt || undefined,
        },
      }),
    onSuccess: (token) => {
      setCreatedToken(token.token ?? null);
      setName("");
      setExpiresAt("");
      queryClient.invalidateQueries({ queryKey: ["mcp-tokens", projectId] });
      toast.success("Token MCP creado; cópialo ahora");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const revoke = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/mcp-tokens/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Token revocado");
      queryClient.invalidateQueries({ queryKey: ["mcp-tokens", projectId] });
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integraciones MCP</CardTitle>
        <CardDescription>
          Tokens de solo lectura para consultar desempeño desde clientes MCP.
          Solo se muestran una vez.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {createdToken ? (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <p className="mb-1 font-medium">Copia este token ahora:</p>
            <code className="break-all text-xs">{createdToken}</code>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                void navigator.clipboard.writeText(createdToken);
                toast.success("Token copiado");
              }}
            >
              Copiar
            </Button>
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mcpName">Nombre</Label>
            <Input
              id="mcpName"
              placeholder="Asistente del curso"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mcpExpires">Expiración (opcional)</Label>
            <Input
              id="mcpExpires"
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </div>
        </div>
        <div>
          <Button
            onClick={() => create.mutate()}
            disabled={!name.trim() || create.isPending}
          >
            Crear token
          </Button>
        </div>

        <div className="flex flex-col gap-2 border-t pt-3">
          {tokens.data?.length ? (
            tokens.data.map((token) => (
              <div
                key={token.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm"
              >
                <div>
                  <p className="font-medium">{token.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {token.revokedAt
                      ? "Revocado"
                      : token.lastUsedAt
                        ? `Último uso: ${new Date(token.lastUsedAt).toLocaleDateString("es")}`
                        : "Sin uso"}
                    {token.expiresAt
                      ? ` · Expira ${new Date(token.expiresAt).toLocaleDateString("es")}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">performance:read</Badge>
                  {!token.revokedAt ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revoke.mutate(token.id)}
                      disabled={revoke.isPending}
                    >
                      Revocar
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no hay tokens MCP.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
