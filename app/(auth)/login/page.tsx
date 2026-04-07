"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, useActionState, useEffect, useMemo, useState } from "react";

import { AuthForm } from "@/components/chat/auth-form";
import { SubmitButton } from "@/components/chat/submit-button";
import { toast } from "@/components/chat/toast";
import { useI18n } from "@/hooks/use-i18n";
import { getSafeRedirectUrl } from "@/lib/auth/redirect";
import { type LoginActionState, login } from "../actions";

function LoginPageContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const redirectUrl = useMemo(
    () => getSafeRedirectUrl(searchParams.get("redirectUrl")),
    [searchParams]
  );
  const registerHref =
    redirectUrl === "/"
      ? "/register"
      : `/register?redirectUrl=${encodeURIComponent(redirectUrl)}`;

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    { status: "idle" }
  );

  const { update: updateSession } = useSession();

  // biome-ignore lint/correctness/useExhaustiveDependencies: router and updateSession are stable refs
  useEffect(() => {
    if (state.status === "failed") {
      toast({ type: "error", description: t("auth.invalidCredentials") });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: t("auth.failedValidation"),
      });
    } else if (state.status === "success") {
      setIsSuccessful(true);
      const target = state.redirectTo ?? redirectUrl;
      void updateSession().finally(() => {
        router.replace(target);
      });
    }
  }, [redirectUrl, router, state.redirectTo, state.status, t, updateSession]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formData.set("redirectUrl", redirectUrl);
    formAction(formData);
  };

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("auth.welcomeBack")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("auth.signInDescription")}
      </p>
      <AuthForm action={handleSubmit} defaultEmail={email}>
        <SubmitButton isSuccessful={isSuccessful}>
          {t("auth.signIn")}
        </SubmitButton>
        <p className="text-center text-[13px] text-muted-foreground">
          {`${t("auth.noAccount")} `}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            href={registerHref}
          >
            {t("auth.signUp")}
          </Link>
        </p>
      </AuthForm>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[240px]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
