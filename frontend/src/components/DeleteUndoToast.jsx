import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function DeleteUndoToast({
    t,
    name,
    onUndo,
    successMessage = "Product deleted!",
}) {
    const [seconds, setSeconds] = useState(8);
    const [finished, setFinished] = useState(false);
    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);

                    toast.dismiss(t.id);

                    toast.success(successMessage, {
                        duration: 1500,
                    });

                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const progress = (seconds / 8) * 100;
    if (finished) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontWeight: 600,
                    color: "#4ade80",
                }}
            >
                ✅ Product deleted
            </div>
        );
    }
    return (

        <div
            style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                minWidth: 300,

                background: "rgba(17,24,39,.72)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",

                border: "1px solid rgba(255,255,255,.06)",

                borderRadius: 18,

                padding: "10px 16px",

                boxShadow:
                    "0 8px 28px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.03)",
            }}
        >
            {/* Icon */}
            <div
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    background: "rgba(239,68,68,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                }}
            >
                🗑
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
                <div
                    style={{
                        fontWeight: 700,
                        color: "white",
                        marginBottom: 8,
                    }}
                >
                    Deleting: {name}
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    <div
                        style={{
                            flex: 1,
                            height: 5,
                            background: "rgba(255,255,255,0.08)",
                            borderRadius: 999,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                width: `${progress}%`,
                                height: "100%",
                                background: "#4f8ef7",
                                transition: "width 1s linear",
                            }}
                        />
                    </div>

                    <span
                        style={{
                            fontSize: 12,
                            color: "#aaa",
                            width: 24,
                            textAlign: "center",
                        }}
                    >
                        {String(seconds).padStart(2, "0")}s
                    </span>

                    <button
                        onClick={onUndo}
                        style={{
                            border: "none",
                            background: "#4f8ef7",
                            color: "white",
                            padding: "6px 12px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontWeight: 600,
                        }}
                    >
                        Undo
                    </button>
                </div>
            </div>
        </div>
    );
}