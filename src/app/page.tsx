<<<<<<< HEAD
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
=======
import { redirect } from "next/navigation"

/**
 * Ruta raíz — redirige siempre al login.
 * El middleware se encargará de redirigir al dashboard si hay sesión activa.
 */
export default function HomePage() {
  redirect("/login")
}
>>>>>>> origin/main
