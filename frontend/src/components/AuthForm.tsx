import type { FormEvent } from "react";

type AuthFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  mode: "login" | "register";
};

function AuthForm({ title, description, submitLabel, mode }: AuthFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <section className="mx-auto max-w-md">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30">
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{description}</p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="block">
              <span className="text-sm font-medium text-slate-200">
                Kullanıcı adı
              </span>
              <input
                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                name="username"
                placeholder="omer"
                type="text"
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium text-slate-200">E-posta</span>
            <input
              className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
              name="email"
              placeholder="omer@example.com"
              type="email"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-200">Şifre</span>
            <input
              className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
              name="password"
              placeholder="••••••••"
              type="password"
            />
          </label>

          <button
            className="w-full rounded-md bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            type="submit"
          >
            {submitLabel}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AuthForm;
