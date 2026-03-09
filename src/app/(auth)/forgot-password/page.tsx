"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPassword } from "@/lib/services";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
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
      await forgotPassword(data.email);
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <Card>
      <CardBody className="!py-8">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">
          Forgot password?
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Enter your email and we&apos;ll send you reset instructions.
        </p>

        {error && <Alert variant="error" message={error} />}
        {success && (
          <Alert
            variant="success"
            message="If that email is registered, you'll receive reset instructions shortly."
          />
        )}

        {!success && (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Button type="submit" loading={isSubmitting} className="w-full">
              Send reset link
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/login" className="text-blue-600 hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
