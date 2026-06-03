"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { loginSchema, type LoginFormValues } from "../schemas/loginSchema"
import { useLogin } from "../hooks/useLogin"
import { useGitHubLogin } from "../hooks/useGitHubLogin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export function LoginForm() {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const { handleLogin, isPending } = useLogin({ setError: form.setError })
  const { handleGitHubLogin, isPending: isGitHubPending, error: gitHubError } = useGitHubLogin()

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleLogin)}
        noValidate
        className="space-y-4"
      >
        {/* Error global (401, 429, 403) */}
        {form.formState.errors.root && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          >
            {form.formState.errors.root.message}
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <div className="text-right">
                <Link
                  href="/password/forgot"
                  className="text-xs text-muted-foreground hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || isGitHubPending}
          aria-busy={isPending}
        >
          {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
          </div>
        </div>

        {gitHubError && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          >
            {gitHubError}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isPending || isGitHubPending}
          aria-busy={isGitHubPending}
          onClick={handleGitHubLogin}
        >
          {isGitHubPending ? "Redirigiendo a GitHub..." : (
            <>
              <svg
                className="mr-2 h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continuar con GitHub
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-medium hover:underline">
            Regístrate
          </Link>
        </p>
      </form>
    </Form>
  )
}
