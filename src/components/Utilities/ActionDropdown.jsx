import { useState, useEffect, useRef } from "react";
import { FiMoreVertical } from "react-icons/fi";
import '../../styles/components/actiondropdown.css'

export default function ActionDropdown({ actions = [], onOpen, onClose }) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownDirection, setDropdownDirection] = useState("down");
    const dropdownRef = useRef(null);

    // Keep up-to-date references of parent callbacks without triggering hooks
    const callbacksRef = useRef({ onOpen, onClose });
    useEffect(() => {
        callbacksRef.current = { onOpen, onClose };
    }, [onOpen, onClose]);

    const toggleDropdown = (e) => {
        e.stopPropagation();
        setIsOpen((prev) => !prev);
    };

    // Calculate screen positioning when the menu opens
    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;

            // If space below is less than 220px, push it upwards
            if (spaceBelow < 220) {
                setDropdownDirection("up");
            } else {
                setDropdownDirection("down");
            }
        }
    }, [isOpen]);

    // Triggers clean state switches without looping
    useEffect(() => {
        if (isOpen) {
            if (typeof callbacksRef.current.onOpen === "function") {
                callbacksRef.current.onOpen();
            }
        } else {
            if (typeof callbacksRef.current.onClose === "function") {
                callbacksRef.current.onClose();
            }
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleActionClick = (onClickCallback) => {
        setIsOpen(false); // Auto-close context menu on click
        if (typeof onClickCallback === "function") {
            onClickCallback();
        }
    };

    return (
        <div className="action-dropdown-container" ref={dropdownRef}>
            <button
                type="button"
                className="kebab-menu-btn"
                onClick={toggleDropdown}
                aria-label="Open actions menu"
                aria-expanded={isOpen}
            >
                <FiMoreVertical />
            </button>

            {isOpen && actions.length > 0 && (
                <div className={`dropdown-context-menu is-${dropdownDirection}`}>
                    {actions.map((action, index) => {
                        if (action.type === "divider" || action.hasDivider) {
                            return <hr key={`divider-${index}`} className="dropdown-divider" />;
                        }

                        return (
                            <button
                                key={`action-${index}`}
                                type="button"
                                className={action.isDestructive ? "is-destructive" : ""}
                                onClick={() => handleActionClick(action.onClick)}
                            >
                                {action.icon}
                                <span>{action.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}