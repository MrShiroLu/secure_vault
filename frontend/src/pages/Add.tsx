import axios from "axios";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addVaultItem, type VaultItemType } from "../lib/vaultApi";
import {
  fieldLabels,
  getFieldError,
  maskCreditCard,
  validateField,
} from "../lib/validators";

const fieldOptions: VaultItemType[] = [
  "iban",
  "kredi_karti",
  "eposta",
  "tc_kimlik",
  "telefon",
];

function Add() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState<VaultItemType>("iban");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedValue =
    type === "kredi_karti" ? value : value.replace(/\s/g, "").trim();
  const displayValue = type === "kredi_karti" ? maskCreditCard(value) : value;
  const valueError = useMemo(
    () => getFieldError(type, normalizedValue),
    [normalizedValue, type],
  );
  const isValueValid = validateField(type, normalizedValue);
  const isFormValid = Boolean(name.trim()) && isValueValid;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addVaultItem({
        name: name.trim(),
        type,
        value: normalizedValue,
      });
      navigate(`/vault/${result.id}`);
    } catch (requestError) {
      if (axios.isAxiosError<{ error?: string }>(requestError)) {
        setError(requestError.response?.data.error ?? "Belge eklenemedi.");
      } else {
        setError("Beklenmeyen bir hata oluştu.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleValueChange(nextValue: string) {
    if (type === "kredi_karti") {
      setValue(nextValue.replace(/\D/g, "").slice(0, 16));
      return;
    }

    setValue(nextValue);
  }

  function handleTypeChange(nextType: VaultItemType) {
    setType(nextType);
    setValue("");
    setError("");
  }

  return (
    <section className="mx-auto max-w-2xl rounded-lg border border-slate-800 bg-slate-900 p-6">
      <h1 className="text-3xl font-semibold">Veri Ekle</h1>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-200">Belge adı</span>
          <input
            className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
            onChange={(event) => setName(event.target.value)}
            placeholder="Kişisel IBAN"
            type="text"
            value={name}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">Veri türü</span>
          <select
            className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
            onChange={(event) =>
              handleTypeChange(event.target.value as VaultItemType)
            }
            value={type}
          >
            {fieldOptions.map((fieldType) => (
              <option key={fieldType} value={fieldType}>
                {fieldLabels[fieldType]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">
            {fieldLabels[type]}
          </span>
          <input
            className={[
              "mt-2 w-full rounded-md border bg-slate-950 px-3 py-2 text-slate-100 outline-none transition placeholder:text-slate-500",
              displayValue
                ? isValueValid
                  ? "border-emerald-400 focus:border-emerald-300"
                  : "border-red-400 focus:border-red-300"
                : "border-slate-700 focus:border-cyan-400",
            ].join(" ")}
            onChange={(event) => handleValueChange(event.target.value)}
            placeholder={fieldLabels[type]}
            type="text"
            value={displayValue}
          />
          {displayValue && valueError && (
            <span className="mt-1 block text-sm text-red-300">
              {valueError}
            </span>
          )}
        </label>

        {error && (
          <p className="rounded-md border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <button
          className="rounded-md bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          disabled={!isFormValid || isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </section>
  );
}

export default Add;
