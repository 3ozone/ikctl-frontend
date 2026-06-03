"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { profileSchema, type ProfileFormValues } from "../schemas/profileSchemas"
import { useProfile } from "../hooks/useProfile"
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

export function ProfileForm() {
  const { profile, isLoading, error, isSaving, saveSuccess, updateProfile } =
    useProfile()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "" },
  })

  // Rellenar el formulario cuando carguen los datos
  useEffect(() => {
    if (profile) {
      form.reset({ name: profile.name })
    }
  }, [profile, form])

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground" aria-busy="true" aria-live="polite">
        Cargando perfil...
      </p>
    )
  }

  if (error) {
    return (
      <p role="alert" aria-live="polite" className="text-sm text-destructive">
        {error}
      </p>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => updateProfile(values.name))}
        noValidate
        className="space-y-4"
      >
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Email:</span> {profile?.email}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Estado:</span>{" "}
            {profile?.is_verified ? "Verificado ✓" : "No verificado"}
          </p>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input type="text" autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {saveSuccess && (
          <p role="status" aria-live="polite" className="text-sm text-green-600">
            Perfil actualizado correctamente.
          </p>
        )}

        <Button
          type="submit"
          disabled={isSaving}
          aria-busy={isSaving}
        >
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </Form>
  )
}
