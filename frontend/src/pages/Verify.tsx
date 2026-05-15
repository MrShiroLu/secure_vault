import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import {
  getSharedDocument,
  type SharedDocumentVerification,
} from "../lib/vaultApi";
import { fieldLabels } from "../lib/validators";

function Verify() {
  const { token } = useParams();
  const [document, setDocument] = useState<SharedDocumentVerification | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    getSharedDocument(token)
      .then((sharedDocument) => {
        setDocument(sharedDocument);
      })
      .catch((requestError: unknown) => {
        if (axios.isAxiosError<{ error?: string }>(requestError)) {
          setError(
            requestError.response?.data.error ?? "Doğrulama yapılamadı.",
          );
        } else {
          setError("Beklenmeyen bir hata oluştu.");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  if (!token) {
    return (
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-3xl font-semibold">İmza Doğrulama</h1>
        <p className="mt-6 rounded-md border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          Doğrulama tokenı bulunamadı.
        </p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <Spinner />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl rounded-lg border border-slate-800 bg-slate-900 p-6">
      <h1 className="text-3xl font-semibold">İmza Doğrulama</h1>

      {error && (
        <p className="mt-6 rounded-md border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {document && (
        <div className="mt-6 space-y-4">
          <span
            className={[
              "inline-flex rounded-md px-3 py-2 text-sm font-semibold",
              document.valid
                ? "bg-emerald-400 text-slate-950"
                : "bg-red-500 text-white",
            ].join(" ")}
          >
            {document.valid ? "İmza geçerli" : "İmza geçersiz"}
          </span>

          <dl className="grid gap-4 rounded-md border border-slate-800 bg-slate-950 p-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-400">Belge</dt>
              <dd className="mt-1 font-medium text-slate-100">
                {document.name}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Tür</dt>
              <dd className="mt-1 font-medium text-slate-100">
                {fieldLabels[document.type]}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">İmzalayan</dt>
              <dd className="mt-1 font-medium text-slate-100">
                {document.signed_by}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Tarih</dt>
              <dd className="mt-1 font-medium text-slate-100">
                {document.signed_at ?? "-"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-slate-400">SHA-256</dt>
              <dd className="mt-1 break-all font-mono text-sm text-slate-100">
                {document.sha256}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}

export default Verify;
