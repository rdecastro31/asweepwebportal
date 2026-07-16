import { useState, useMemo, useEffect, useRef } from "react";
import { FiChevronDown } from "react-icons/fi";
import "../../styles/components/searchabledropdown.css"; // Adjust path as needed

export default function SearchableDropdown({
    label,
    placeholder = "Search...",
    options = [],
    selectedValue,
    onSelect,
    required = false,
    icon: Icon, // Accepts a React Icon component (e.g., FiCreditCard, FiAlertCircle)
    onLoadMore, // Callback function triggered when scrolling near bottom
    hasMore = false, // Boolean indicating if more items are available to fetch
    isLoadingMore = false, // Boolean showing a subtle loader indicator at the bottom
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef(null);
    const menuListRef = useRef(null); // Reference to track scrolling container

    const normalizedOptions = useMemo(() => {
        return options.map((opt) =>
            typeof opt === "string" ? { value: opt, label: opt } : opt
        );
    }, [options]);

    const currentSelectedLabel = useMemo(() => {
        const found = normalizedOptions.find((opt) => opt.value === selectedValue);
        return found ? found.label : "";
    }, [selectedValue, normalizedOptions]);

    const filteredOptions = useMemo(() => {
        return normalizedOptions.filter((opt) =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opt.value.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, normalizedOptions]);

    // Handle detecting scroll position to trigger pagination
    const handleScroll = (e) => {
        if (!onLoadMore || !hasMore || isLoadingMore) return;

        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

        // Trigger load more when user is 15px away from reaching bottom threshold
        if (scrollHeight - scrollTop <= clientHeight + 15) {
            onLoadMore(searchQuery);
        }
    };

    useEffect(() => {
        function handleOutsideClick(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchQuery(currentSelectedLabel);
            }
        }
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [currentSelectedLabel]);

    useEffect(() => {
        setSearchQuery(currentSelectedLabel);
    }, [currentSelectedLabel]);

    return (
        <div className={`dropdown-wrapper ${isOpen ? "is-open" : ""}`} ref={dropdownRef}>
            {label && <label>{label}</label>}

            <div className={`dropdown-field-relative ${Icon ? "has-left-icon" : ""}`}>
                {Icon && <Icon className="dropdown-left-icon" />}

                <input
                    type="text"
                    className="dropdown-control-input"
                    placeholder={placeholder}
                    value={searchQuery}
                    required={required && !selectedValue}
                    onFocus={() => {
                        setIsOpen(true);
                        setSearchQuery("");
                    }}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <FiChevronDown className="dropdown-icon-indicator" />
            </div>

            {isOpen && (
                <div
                    className="dropdown-menu-list"
                    ref={menuListRef}
                    onScroll={handleScroll}
                >
                    {filteredOptions.length > 0 ? (
                        <>
                            {filteredOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`dropdown-item-row ${selectedValue === opt.value ? "selected" : ""}`}
                                    onClick={() => {
                                        onSelect(opt.value);
                                        setSearchQuery(opt.label);
                                        setIsOpen(false);
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}

                            {/* Scroll Pagination Loader Indicator */}
                            {isLoadingMore && (
                                <div className="dropdown-loading-more">
                                    <span className="dropdown-spinner"></span>
                                    Loading more...
                                </div>
                            )}
                        </>
                    ) : (
                        !isLoadingMore && <div className="no-options-fallback">No matches found</div>
                    )}

                    {/* Fallback loader if list was completely empty but fetching initial items */}
                    {filteredOptions.length === 0 && isLoadingMore && (
                        <div className="dropdown-loading-more">
                            <span className="dropdown-spinner"></span>
                            Loading...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}