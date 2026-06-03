"use client"

import { useProfile } from "@/features/profile/hooks/useProfile"
import { ProfileForm } from "@/features/profile/components/ProfileForm"
import { ChangePasswordForm } from "@/features/profile/components/ChangePasswordForm"
import { TwoFASettings } from "@/features/profile/components/TwoFASettings"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

export default function ProfilePage() {
  const { profile, fetchProfile } = useProfile()

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-semibold">Mi perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Información personal</CardTitle>
          <CardDescription>Actualiza tu nombre de usuario</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
          <CardDescription>
            Introduce tu contraseña actual y la nueva
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verificación en dos pasos (2FA)</CardTitle>
          <CardDescription>
            Aumenta la seguridad de tu cuenta con un código TOTP
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile !== null && (
            <TwoFASettings
              is2FAEnabled={profile?.is_2fa_enabled ?? false}
              onChanged={fetchProfile}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
