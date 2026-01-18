"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MessageSquare, 
  Lightbulb, 
  Bug, 
  StickyNote, 
  UserX,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { signOutAction } from "./side-nav-actions";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  {
    title: "Message Log",
    href: "/dashboard/messagelog",
    icon: MessageSquare,
  },
  {
    title: "Feature Requests",
    href: "/dashboard/featurerequest",
    icon: Lightbulb,
  },
  {
    title: "Bug Reports",
    href: "/dashboard/bugreport",
    icon: Bug,
  },
  {
    title: "Notes",
    href: "/dashboard/notes",
    icon: StickyNote,
  },
  {
    title: "Ignored Users",
    href: "/dashboard/ignored",
    icon: UserX,
  },
];

interface SideNavProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
}

export function SideNav({ user }: SideNavProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Floating Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-md hover:bg-muted transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {/* Header */}
      <div className={cn(
        "flex items-center h-16 border-b border-border overflow-hidden",
        collapsed ? "justify-center px-2" : "px-4"
      )}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="shrink-0"
          />
          {!collapsed && (
            <span className="font-semibold text-foreground whitespace-nowrap">SituationCord</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4 space-y-3 overflow-hidden">
        {/* Theme Toggle */}
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && <span className="text-sm text-muted-foreground whitespace-nowrap">Theme</span>}
          <ThemeToggle />
        </div>

        {/* User Info */}
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          {user.image ? (
            <Image
              src={user.image}
              alt="User avatar"
              width={32}
              height={32}
              className="rounded-full shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium shrink-0">
              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <form action={signOutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className={cn(
              "w-full text-muted-foreground hover:text-foreground hover:bg-muted",
              collapsed ? "px-0 justify-center" : "justify-start"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-2 whitespace-nowrap">Sign Out</span>}
          </Button>
        </form>
      </div>
    </aside>
  );
}
