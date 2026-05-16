export default function ConfirmModal({
    open,
    title,
    message,
    onConfirm,
    onCancel,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[90%] max-w-md rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl">

                <h2 className="text-xl font-bold text-white">
                    {title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-300">
                    {message}
                </p>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="rounded-xl bg-gray-700 px-4 py-2 text-white transition hover:bg-gray-600"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        className="rounded-xl bg-red-600 px-4 py-2 text-white transition hover:bg-red-500"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}