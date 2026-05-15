import axios from "axios";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { setAuthToken } from "../lib/auth";
import { getFieldError } from "../lib/validators";

type AuthFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  mode: "login" | "register";
};

function AuthForm({ title, description, submitLabel, mode }: AuthFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const emailError = useMemo(() => getFieldError("eposta", email), [email]);
  const passwordError = password.length >= 8 ? "" : "Şifre en az 8 karakter olmalı.";
  const isFormValid = !emailError && !passwordError;

  const inputClassName = (hasError: boolean, isValid: boolean) =>
    [
      "mt-2 w-full rounded-md border bg-slate-950 px-3 py-2 text-slate-100 outline-none transition placeholder:text-slate-500",
      hasError
        ? "border-red-400 focus:border-red-300"
        : isValid
          ? "border-emerald-400 focus:border-emerald-300"
          : "border-slate-700 focus:border-cyan-400",
    ].join(" ");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);
    setStatusMessage("");

    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const response = await api.post<{ token: string }>("/api/login", {
          email: email.trim(),
          password,
        });

        setAuthToken(response.data.token);
        const from =
          (location.state as { from?: { pathname?: string } } | null)?.from
            ?.pathname ?? "/vault";
        navigate(from, { replace: true });
        return;
      }

      await api.post("/api/register", {
        email: email.trim(),
        password,
      });

      setStatusMessage("Kayıt başarılı. Giriş yapabilirsiniz.");
      navigate("/login");
    } catch (error) {
      if (axios.isAxiosError<{ error?: string }>(error)) {
        setStatusMessage(error.response?.data.error ?? "İstek tamamlanamadı.");
      } else {
        setStatusMessage("Beklenmeyen bir hata oluştu.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30">
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{description}</p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">E-posta</span>
            <input
              className={inputClassName(Boolean(email && emailError), Boolean(email && !emailError))}
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="omer@example.com"
              type="email"
              value={email}
            />
            {email && emailError && (
              <span className="mt-1 block text-sm text-red-300">{emailError}</span>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-200">Şifre</span>
            <input
              className={inputClassName(
                Boolean(password && passwordError),
                Boolean(password && !passwordError),
              )}
              name="password"
              placeholder="••••••••"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
            {password && passwordError && (
              <span className="mt-1 block text-sm text-red-300">
                {passwordError}
              </span>
            )}
          </label>

          {hasSubmitted && !isFormValid && (
            <p className="rounded-md border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              Formdaki hataları düzeltin.
            </p>
          )}

          {statusMessage && (
            <p className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
              {statusMessage}
            </p>
          )}

          <button
            className="w-full rounded-md bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            disabled={isSubmitting || !isFormValid}
            type="submit"
          >
            {isSubmitting ? "Gönderiliyor..." : submitLabel}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AuthForm;
