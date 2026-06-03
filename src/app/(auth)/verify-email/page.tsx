<<<<<<< HEAD
"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyEmail } from "@/lib/services";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error"
  );
  const [message, setMessage] = useState(
    token ? "" : "Invalid or missing verification token."
  );
  const verified = useRef(false);

  useEffect(() => {
    if (!token || verified.current) return;
    verified.current = true;
    verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message ?? "Email verified successfully!");
        setTimeout(() => router.push("/login"), 3000);
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { message?: string } } };
        setStatus("error");
        setMessage(
          e?.response?.data?.message ??
            "Verification failed. The link may have expired."
        );
      });
  }, [token, router]);

  return (
    <Card>
      <CardBody className="!py-8 text-center">
        {status === "loading" && (
          <p className="text-slate-500">Verifying your email…</p>
        )}
        {status === "success" && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <Alert variant="success" message={message} />
            <p className="mt-3 text-sm text-slate-500">Redirecting to sign in…</p>
          </>
        )}
        {status === "error" && (
          <>
            <Alert variant="error" message={message} />
            <Button
              className="mt-4 w-full"
              variant="secondary"
              onClick={() => router.push("/login")}
            >
              Back to sign in
            </Button>
            <Link href="/login" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
              Resend verification email
            </Link>
          </>
        )}
      </CardBody>
    </Card>
  );
=======
"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
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
import { useVerifyEmail } from "@/features/auth/hooks/useVerifyEmail"
import {
  resendVerificationSchema,
  type ResendVerificationFormValues,
} from "@/features/auth/schemas/verifyEmailSchema"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const { status, errorMessage, isResending, resendSuccess, resendVerification } =
    useVerifyEmail({ token })

  const form = useForm<ResendVerificationFormValues>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: "" },
  })

  if (status === "loading" || status === "idle") {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Verificando tu email...
          </CardTitle>
          <CardDescription className="text-center" aria-live="polite" aria-busy="true">
            Un momento, estamos validando tu cuenta.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (status === "success") {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">¡Email verificado!</CardTitle>
          <CardDescription className="text-center">
            Tu cuenta está activa. Ya puedes iniciar sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Iniciar sesión
          </Link>
        </CardContent>
      </Card>
    )
  }

  // status === "error"
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Enlace no válido</CardTitle>
        <CardDescription className="text-center" aria-live="polite">
          {errorMessage}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {resendSuccess ? (
          <p
            role="status"
            aria-live="polite"
            className="text-center text-sm text-muted-foreground"
          >
            Si el email está registrado, recibirás un nuevo enlace en breve.
          </p>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                resendVerification(values.email),
              )}
              noValidate
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tu email</FormLabel>
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
              <Button type="submit" className="w-full" disabled={isResending}>
                {isResending ? "Enviando..." : "Reenviar enlace de verificación"}
              </Button>
            </form>
          </Form>
        )}
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  )
>>>>>>> origin/main
}

export default function VerifyEmailPage() {
  return (
<<<<<<< HEAD
    <Suspense fallback={<div className="text-center text-slate-500 text-sm">Loading…</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
=======
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
>>>>>>> origin/main
}
