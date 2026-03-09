"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getMe,
  updateMe,
  changePassword,
  enable2fa,
  verify2fa,
  disable2fa,
} from "@/lib/services";
import type { UserProfile } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
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
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [twoFaStep, setTwoFaStep] = useState<"idle" | "setup" | "verify" | "disable">("idle");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [twoFaMsg, setTwoFaMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  const {
    register: regPw,
    handleSubmit: handlePw,
    reset: resetPw,
    formState: { errors: pwErrors, isSubmitting: pwSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    getMe().then((u) => {
      setUser(u);
      resetProfile({ name: u.name });
    });
  }, [resetProfile]);

  const onProfileSubmit = async (data: ProfileForm) => {
    setProfileMsg(null);
    try {
      const updated = await updateMe(data);
      setUser(updated);
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch {
      setProfileMsg({ type: "error", text: "Failed to update profile." });
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPwMsg(null);
    try {
      await changePassword(data.current_password, data.new_password);
      setPwMsg({ type: "success", text: "Password changed successfully." });
      resetPw();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setPwMsg({ type: "error", text: e?.response?.data?.message ?? "Failed to change password." });
    }
  };

  const handleEnable2fa = async () => {
    setTwoFaMsg(null);
    setTwoFaLoading(true);
    try {
      const res = await enable2fa();
      setQrCode(res.qr_code);
      setTwoFaStep("verify");
    } catch {
      setTwoFaMsg({ type: "error", text: "Failed to enable 2FA." });
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleVerify2fa = async () => {
    setTwoFaMsg(null);
    setTwoFaLoading(true);
    try {
      const res = await verify2fa(twoFaCode);
      setBackupCodes(res.backup_codes);
      setTwoFaStep("idle");
      setUser((u) => u ? { ...u, two_factor_enabled: true } : u);
      setTwoFaMsg({ type: "success", text: "2FA enabled successfully!" });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setTwoFaMsg({ type: "error", text: e?.response?.data?.message ?? "Invalid code." });
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleDisable2fa = async () => {
    setTwoFaMsg(null);
    setTwoFaLoading(true);
    try {
      await disable2fa(disablePassword);
      setTwoFaStep("idle");
      setUser((u) => u ? { ...u, two_factor_enabled: false } : u);
      setTwoFaMsg({ type: "success", text: "2FA disabled." });
      setDisablePassword("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setTwoFaMsg({ type: "error", text: e?.response?.data?.message ?? "Failed to disable 2FA." });
    } finally {
      setTwoFaLoading(false);
    }
  };

  if (!user) {
    return <p className="text-sm text-slate-400">Loading profile…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500">Manage your account settings.</p>
      </div>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Personal information</h2>
        </CardHeader>
        <CardBody>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
              {user.name[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-slate-800">{user.name}</p>
              <p className="text-sm text-slate-400">{user.email}</p>
              <p className="text-xs text-slate-400">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {profileMsg && (
            <Alert variant={profileMsg.type} message={profileMsg.text} />
          )}

          <form
            onSubmit={handleProfile(onProfileSubmit)}
            className="mt-4 space-y-4"
          >
            <Input
              label="Full name"
              error={profileErrors.name?.message}
              {...regProfile("name")}
            />
            <Input label="Email" type="email" value={user.email} disabled />
            <div className="flex justify-end">
              <Button type="submit" loading={profileSubmitting}>
                Save changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Change password</h2>
        </CardHeader>
        <CardBody>
          {pwMsg && <Alert variant={pwMsg.type} message={pwMsg.text} />}
          <form
            onSubmit={handlePw(onPasswordSubmit)}
            className="mt-4 space-y-4"
          >
            <Input
              label="Current password"
              type="password"
              placeholder="••••••••"
              error={pwErrors.current_password?.message}
              {...regPw("current_password")}
            />
            <Input
              label="New password"
              type="password"
              placeholder="••••••••"
              hint="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
              error={pwErrors.new_password?.message}
              {...regPw("new_password")}
            />
            <Input
              label="Confirm new password"
              type="password"
              placeholder="••••••••"
              error={pwErrors.confirmPassword?.message}
              {...regPw("confirmPassword")}
            />
            <div className="flex justify-end">
              <Button type="submit" loading={pwSubmitting}>
                Change password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              Two-factor authentication
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user.two_factor_enabled
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {user.two_factor_enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </CardHeader>
        <CardBody>
          {twoFaMsg && <Alert variant={twoFaMsg.type} message={twoFaMsg.text} />}

          {twoFaStep === "idle" && (
            <>
              <p className="text-sm text-slate-500">
                {user.two_factor_enabled
                  ? "Your account is protected with 2FA."
                  : "Add an extra layer of security to your account."}
              </p>
              <div className="mt-4 flex gap-3">
                {!user.two_factor_enabled && (
                  <Button onClick={handleEnable2fa} loading={twoFaLoading}>
                    Enable 2FA
                  </Button>
                )}
                {user.two_factor_enabled && (
                  <Button
                    variant="danger"
                    onClick={() => setTwoFaStep("disable")}
                  >
                    Disable 2FA
                  </Button>
                )}
              </div>
            </>
          )}

          {twoFaStep === "verify" && qrCode && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Scan this QR code with your authenticator app, then enter the
                6-digit code below.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCode}
                alt="2FA QR code"
                className="mx-auto h-48 w-48 rounded-lg border border-slate-200"
              />
              <Input
                label="Verification code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value)}
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleVerify2fa}
                  loading={twoFaLoading}
                  disabled={twoFaCode.length !== 6}
                >
                  Verify & activate
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTwoFaStep("idle");
                    setQrCode(null);
                    setTwoFaCode("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {twoFaStep === "disable" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Enter your password to disable 2FA.
              </p>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  onClick={handleDisable2fa}
                  loading={twoFaLoading}
                  disabled={!disablePassword}
                >
                  Disable 2FA
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTwoFaStep("idle");
                    setDisablePassword("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {backupCodes && (
            <div className="mt-4 rounded-lg border border-slate-200 p-4">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Backup codes (save these somewhere safe):
              </p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code) => (
                  <code
                    key={code}
                    className="rounded bg-slate-100 px-3 py-1 text-sm font-mono text-slate-700"
                  >
                    {code}
                  </code>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
