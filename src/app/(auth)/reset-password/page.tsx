"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@/lib/services";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const schema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.new_password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await resetPassword(token, data.new_password);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Reset failed. The link may have expired.");
    }
  };

  if (!token) {
    return (
      <Card>
        <CardBody className="!py-8 text-center">
          <Alert variant="error" message="Invalid or missing reset token." />
          <Link href="/forgot-password" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
            Request a new link
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="!py-8">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-900">
          Reset your password
        </h1>

        {error && <Alert variant="error" message={error} />}
        {success && (
          <Alert
            variant="success"
            message="Password updated! Redirecting to sign in…"
          />
        )}

        {!success && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="New password"
              type="password"
              placeholder="••••••••"
              hint="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
              error={errors.new_password?.message}
              {...register("new_password")}
            />
            <Input
              label="Confirm new password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
            <Button type="submit" loading={isSubmitting} className="w-full">
              Reset password
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center text-slate-500 text-sm">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
