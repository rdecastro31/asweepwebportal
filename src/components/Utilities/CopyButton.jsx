import { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi"; // Import the icons

const CopyButton = ({ textToCopy, tooltipText = "Copy to clipboard" }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(textToCopy);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Copy failed", err);
        }
    };

    return (
        <div
            className="tooltip-container"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{ position: "relative", display: "inline-block" }}
        >
            <button
                onClick={handleCopy}
                className="copy-btn"
                aria-label={isCopied ? "Copied" : "Copy to clipboard"}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                    marginLeft: "8px",
                    color: isCopied ? "#22c55e" : "#64748b", // Green when copied, slate gray otherwise
                    transition: "color 0.2s ease",
                }}
            >
                {isCopied ? <FiCheck size={16} /> : <FiCopy size={16} />}
            </button>

            {/* Tooltip Element */}
            {showTooltip && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "125%", // Position above the button
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "#1e293b", // Dark slate background
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                        zIndex: 10,
                        transition: "opacity 0.15s ease",
                    }}
                >
                    {isCopied ? "Copied!" : tooltipText}
                    {/* Small arrow pointing down */}
                    <div
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            borderWidth: "5px",
                            borderStyle: "solid",
                            borderColor: "#1e293b transparent transparent transparent"
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default CopyButton;