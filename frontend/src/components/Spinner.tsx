type SpinnerProps = {
  label?: string;
};

function Spinner({ label = "Yükleniyor..." }: SpinnerProps) {
  return (
    <div className="flex items-center gap-3 text-slate-300">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
      <span>{label}</span>
    </div>
  );
}

export default Spinner;
