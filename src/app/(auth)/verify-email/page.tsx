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
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-slate-500 text-sm">Loading…</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
