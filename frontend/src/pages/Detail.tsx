import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  deleteVaultItem,
  getVaultItem,
  type VaultDetailItem,
} from "../lib/vaultApi";
import { fieldLabels } from "../lib/validators";

function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<VaultDetailItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadItem() {
      if (!id) {
        setError("Belge ID bulunamadı.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        setItem(await getVaultItem(id));
      } catch (requestError) {
        if (axios.isAxiosError<{ error?: string }>(requestError)) {
          setError(
            requestError.response?.data.error ?? "Belge görüntülenemedi.",
          );
        } else {
          setError("Beklenmeyen bir hata oluştu.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadItem();
  }, [id]);

  async function handleDelete() {
    if (!item) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await deleteVaultItem(item.id);
      navigate("/vault");
    } catch (requestError) {
      if (axios.isAxiosError<{ error?: string }>(requestError)) {
        setError(requestError.response?.data.error ?? "Belge silinemedi.");
      } else {
        setError("Beklenmeyen bir hata oluştu.");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-6 text-slate-300">
        Yükleniyor...
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      {error && (
        <p className="rounded-md border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {!item && !error && (
        <p className="text-slate-300">Belge bulunamadı.</p>
      )}

      {item && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">{item.name}</h1>
              <p className="mt-2 text-slate-400">{fieldLabels[item.type]}</p>
            </div>

            <span
              className={[
                "rounded-md px-3 py-2 text-sm font-semibold",
                item.integrity === "ok"
                  ? "bg-emerald-400 text-slate-950"
                  : "bg-red-500 text-white",
              ].join(" ")}
            >
              {item.integrity === "ok" ? "SHA-256 doğrulandı" : "Uyarı"}
            </span>
          </div>

          <div className="mt-6 rounded-md border border-slate-800 bg-slate-950 p-4">
            <div className="text-sm font-medium text-slate-400">Şifreyi Çöz</div>
            <p className="mt-2 break-words text-lg text-slate-100">
              {item.value}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              className="rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              to="/vault"
            >
              Kasa'ya dön
            </Link>
            <button
              className="rounded-md border border-red-400/60 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-950"
              onClick={() => setShowDeleteConfirm(true)}
              type="button"
            >
              Sil
            </button>
          </div>
        </>
      )}

      {showDeleteConfirm && item && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h2 className="text-xl font-semibold">Belge silinsin mi?</h2>
            <p className="mt-2 text-slate-400">
              {item.name} kalıcı olarak silinecek.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                onClick={() => setShowDeleteConfirm(false)}
                type="button"
              >
                Vazgeç
              </button>
              <button
                className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                disabled={isDeleting}
                onClick={handleDelete}
                type="button"
              >
                {isDeleting ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Detail;
