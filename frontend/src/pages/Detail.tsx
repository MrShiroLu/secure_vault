import { useParams } from "react-router-dom";

function Detail() {
  const { id } = useParams();

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      <h1 className="text-3xl font-semibold">Belge Detayı</h1>
      <p className="mt-2 text-slate-400">Belge ID: {id}</p>
    </section>
  );
}

export default Detail;
