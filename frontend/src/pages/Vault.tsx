import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Spinner from "../components/Spinner";
import { deleteVaultItem, listVaultItems, type VaultListItem } from "../lib/vaultApi";
import { fieldLabels } from "../lib/validators";

function Vault() {
  const [items, setItems] = useState<VaultListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<VaultListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await deleteVaultItem(deleteTarget.id);
      setItems((currentItems) =>
        currentItems.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
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

  useEffect(() => {
    listVaultItems()
      .then((loadedItems) => {
        setItems(loadedItems);
      })
      .catch((requestError: unknown) => {
        if (axios.isAxiosError<{ error?: string }>(requestError)) {
          setError(
            requestError.response?.data.error ?? "Belgeler yüklenemedi.",
          );
        } else {
          setError("Beklenmeyen bir hata oluştu.");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Kasa</h1>
          <p className="mt-2 text-slate-400">
            Şifrelenmiş belgeleriniz ve maskelenmiş önizlemeleri.
          </p>
        </div>

        <Link
          className="rounded-md bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          to="/vault/add"
        >
          Veri Ekle
        </Link>
      </div>

      {isLoading && (
        <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-6">
          <Spinner />
        </div>
      )}

      {error && (
        <p className="mt-6 rounded-md border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Henüz belge yok</h2>
          <p className="mt-2 text-slate-400">
            İlk belgenizi ekleyerek kasayı doldurmaya başlayın.
          </p>
          <Link
            className="mt-4 inline-flex rounded-md bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            to="/vault/add"
          >
            İlk belgeyi ekle
          </Link>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="mt-8 grid gap-4">
          {items.map((item) => (
            <article
              className="rounded-lg border border-slate-800 bg-slate-900 p-5"
              key={item.id}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">{item.name}</h2>
                    {item.signed && (
                      <span className="rounded-md bg-violet-400 px-2 py-1 text-xs font-semibold text-slate-950">
                        İmzalı
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {fieldLabels[item.type]} · {item.preview}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <Link
                    className="rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                    to={`/vault/${item.id}`}
                  >
                    Görüntüle
                  </Link>
                  <button
                    className="rounded-md border border-red-400/60 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-950"
                    onClick={() => setDeleteTarget(item)}
                    type="button"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h2 className="text-xl font-semibold">Belge silinsin mi?</h2>
            <p className="mt-2 text-slate-400">
              {deleteTarget.name} kalıcı olarak silinecek.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                onClick={() => setDeleteTarget(null)}
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

export default Vault;
