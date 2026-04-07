import Form from "next/form";

import { signOut } from "@/app/(auth)/auth";
import { enDictionary } from "@/lib/i18n/dictionaries/en";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import { getTranslation } from "@/lib/i18n/translate";

export const SignOutForm = async () => {
  const locale = await getRequestLocale();
  const dictionary = await getDictionary(locale);
  const signOutLabel = getTranslation(
    dictionary,
    "chat.navigation.signOut",
    enDictionary
  );

  return (
    <Form
      action={async () => {
        "use server";

        await signOut({
          redirectTo: "/",
        });
      }}
      className="w-full"
    >
      <button
        className="w-full px-1 py-0.5 text-left text-red-500"
        type="submit"
      >
        {signOutLabel}
      </button>
    </Form>
  );
};
