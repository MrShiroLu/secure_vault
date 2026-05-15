type ToastProps = {
  message: string;
  tone?: "success" | "error";
};

function Toast({ message, tone = "success" }: ToastProps) {
  return (
    <div
      className={[
        "fixed right-4 top-4 z-20 max-w-sm rounded-md border px-4 py-3 text-sm shadow-xl",
        tone === "success"
          ? "border-emerald-400/40 bg-emerald-950 text-emerald-100"
          : "border-red-400/40 bg-red-950 text-red-100",
      ].join(" ")}
      role="status"
    >
      {message}
    </div>
  );
}

export default Toast;
