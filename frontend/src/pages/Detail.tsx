import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import Toast from "../components/Toast";
import {
  createShareToken,
  deleteVaultItem,
  getVaultItem,
  signVaultItem,
  verifyVaultItem,
  type SignatureVerification,
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
  const [isValueRevealed, setIsValueRevealed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isCreatingShareLink, setIsCreatingShareLink] = useState(false);
  const [signature, setSignature] = useState<SignatureVerification | null>(
    null,
  );
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    async function loadItem() {
      if (!id) {
        setError("Belge ID bulunamadı.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      setIsValueRevealed(false);
      setShareMessage("");

      try {
        const loadedItem = await getVaultItem(id);
        setItem(loadedItem);

        if (loadedItem.signed) {
          setSignature(await verifyVaultItem(loadedItem.id));
        } else {
          setSignature(null);
        }
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

  async function handleSign() {
    if (!item) {
      return;
    }

    setIsSigning(true);
    setError("");
    setShareMessage("");

    try {
      const result = await signVaultItem(item.id);
      const updatedItem = {
        ...item,
        signed: true,
        signed_at: result.signed_at,
      };
      setItem(updatedItem);
      setSignature(await verifyVaultItem(updatedItem.id));
    } catch (requestError) {
      if (axios.isAxiosError<{ error?: string }>(requestError)) {
        setError(requestError.response?.data.error ?? "Belge imzalanamadı.");
      } else {
        setError("Beklenmeyen bir hata oluştu.");
      }
    } finally {
      setIsSigning(false);
    }
  }

  async function handleCreateShareLink() {
    if (!item) {
      return;
    }

    setIsCreatingShareLink(true);
    setError("");
    setShareMessage("");

    try {
      const result = await createShareToken(item.id);
      const verifyUrl = `${window.location.origin}/verify/${result.token}`;
      await navigator.clipboard.writeText(verifyUrl);
      setShareMessage("Paylaşım linki kopyalandı.");
    } catch (requestError) {
      if (axios.isAxiosError<{ error?: string }>(requestError)) {
        setError(
          requestError.response?.data.error ?? "Paylaşım linki oluşturulamadı.",
        );
      } else {
        setError("Beklenmeyen bir hata oluştu.");
      }
    } finally {
      setIsCreatingShareLink(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <Spinner />
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      {shareMessage && <Toast message={shareMessage} />}

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
            {item.signed && (
              <span className="rounded-md bg-violet-400 px-3 py-2 text-sm font-semibold text-slate-950">
                İmzalı
              </span>
            )}
          </div>

          <div className="mt-6 rounded-md border border-slate-800 bg-slate-950 p-4">
            {isValueRevealed ? (
              <>
                <div className="text-sm font-medium text-slate-400">
                  Çözülmüş değer
                </div>
                <p className="mt-2 break-words text-lg text-slate-100">
                  {item.value}
                </p>
              </>
            ) : (
              <button
                className="rounded-md bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                onClick={() => setIsValueRevealed(true)}
                type="button"
              >
                Şifreyi Çöz
              </button>
            )}
          </div>

          <div className="mt-6 grid gap-2 sm:flex sm:flex-wrap">
            <button
              className="rounded-md bg-violet-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              disabled={isSigning || item.signed}
              onClick={handleSign}
              type="button"
            >
              {isSigning
                ? "İmzalanıyor..."
                : item.signed
                  ? "İmzalandı"
                  : "İmzala"}
            </button>
            <button
              className="rounded-md bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              disabled={isCreatingShareLink || !item.signed}
              onClick={handleCreateShareLink}
              type="button"
            >
              {isCreatingShareLink
                ? "Oluşturuluyor..."
                : "Paylaşım Linki Oluştur"}
            </button>
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

          {signature && (
            <div className="mt-6 rounded-md border border-slate-800 bg-slate-950 p-4">
              <h2 className="text-lg font-semibold">İmza Detayı</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-slate-400">Durum</dt>
                  <dd className="mt-1 font-medium text-slate-100">
                    {signature.valid ? "Geçerli" : "Geçersiz"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-400">İmzalayan</dt>
                  <dd className="mt-1 font-medium text-slate-100">
                    {signature.signed_by ?? "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-400">Tarih</dt>
                  <dd className="mt-1 font-medium text-slate-100">
                    {signature.signed_at ?? "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-400">Public key özeti</dt>
                  <dd className="mt-1 font-mono text-sm text-slate-100">
                    {signature.public_key_summary ?? "-"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm text-slate-400">SHA-256</dt>
                  <dd className="mt-1 break-all font-mono text-sm text-slate-100">
                    {signature.sha256 ?? "-"}
                  </dd>
                </div>
              </dl>
            </div>
          )}
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
