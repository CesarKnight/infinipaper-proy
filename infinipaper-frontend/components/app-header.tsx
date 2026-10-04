"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLogout, useSession } from "@/lib/session";
import { userAvatarUrl } from "@/lib/api";
import { FolderIcon, LogOutIcon, SearchIcon, UserIcon } from "lucide-react";

export function AppHeader() {
  const { user, isLoading } = useSession();
  const logout = useLogout();
  const pathname = usePathname();

  const initials = user?.displayName
    ?.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-heading font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            I
          </span>
          Infinipaper
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Button
            variant={pathname.startsWith("/projects") ? "secondary" : "ghost"}
            size="sm"
            render={<Link href="/projects" />}
          >
            <FolderIcon data-icon="inline-start" />
            Proyectos
          </Button>
          <Button
            variant={pathname.startsWith("/users") ? "secondary" : "ghost"}
            size="sm"
            render={<Link href="/users" />}
          >
            <SearchIcon data-icon="inline-start" />
            Usuarios
          </Button>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {!isLoading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="Cuenta" />
                }
              >
                <Avatar>
                  {user.avatarUrl ? (
                    <AvatarImage src={userAvatarUrl(user.username)} alt={user.displayName} />
                  ) : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
                  <DropdownMenuItem render={<Link href="/profile" />}>
                    <UserIcon data-icon="inline-start" />
                    Mi perfil
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => logout.mutate()}
                >
                  <LogOutIcon data-icon="inline-start" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !isLoading ? (
            <Button size="sm" render={<Link href="/login" />}>
              Iniciar sesión
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
