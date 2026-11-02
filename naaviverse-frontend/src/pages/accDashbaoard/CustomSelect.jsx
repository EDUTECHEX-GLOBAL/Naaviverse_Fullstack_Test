import React, { useState, useEffect, useRef, useMemo } from 'react';

const CustomSelect = ({
  name = '',
  value,
  onChange,
  options = [],
  placeholder = 'Select',
  disabled = false,
  className = '',
  style = {},
  ariaLabel = '',
  searchable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);
  const itemRefs = useRef([]);

  // Normalize options array into { label, value } objects
  const normalizedOptions = useMemo(() => {
    return (options || []).map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        const lbl = opt.name?.common || opt.name || opt.label || String(opt.value ?? '');
        const val = opt.value !== undefined ? opt.value : (opt.name?.common || opt.name || '');
        return { label: String(lbl), value: val };
      }
      return { label: String(opt), value: opt };
    });
  }, [options]);

  // Auto-enable search if there are 8 or more options
  const showSearch = searchable && normalizedOptions.length >= 8;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (showSearch) {
        setTimeout(() => searchInputRef.current?.focus(), 30);
      }
    } else {
      setSearchQuery('');
      setHighlightIndex(-1);
    }
  }, [isOpen, showSearch]);

  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  const displayLabel = selectedOption
    ? selectedOption.label
    : (value !== '' && value !== undefined && value !== null ? String(value) : placeholder);

  const isPlaceholder = !value && value !== 0 && value !== '0';

  // Filter and sort options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.trim().toLowerCase();
    const startsWith = [];
    const contains = [];

    for (const opt of normalizedOptions) {
      const label = opt.label.toLowerCase();
      if (label.startsWith(q)) {
        startsWith.push(opt);
      } else if (label.includes(q)) {
        contains.push(opt);
      }
    }
    return [...startsWith, ...contains];
  }, [normalizedOptions, searchQuery]);

  const triggerChange = (optVal) => {
    if (onChange) {
      onChange({
        target: { name: name || '', value: optVal },
        currentTarget: { name: name || '', value: optVal },
        value: optVal,
      });
    }
    setIsOpen(false);
  };

  // Handle keyboard events on the trigger / container
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsOpen(true);
        setSearchQuery(e.key);
        return;
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => {
        const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
        itemRefs.current[next]?.scrollIntoView({ block: 'nearest' });
        return next;
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => {
        const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
        itemRefs.current[next]?.scrollIntoView({ block: 'nearest' });
        return next;
      });
      return;
    }

    if (e.key === 'Enter' && highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
      e.preventDefault();
      const chosen = filteredOptions[highlightIndex];
      triggerChange(chosen.value);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-wrapper ${disabled ? 'disabled' : ''} ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`custom-select-trigger ${isOpen ? 'open active' : ''}`}
        aria-label={ariaLabel || placeholder}
      >
        <span className={`custom-select-label trigger-text ${isPlaceholder ? 'placeholder is-placeholder' : ''}`}>
          {displayLabel}
        </span>
        <svg
          className={`custom-select-arrow select-arrow ${isOpen ? 'open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="custom-select-dropdown custom-select-menu">
          {showSearch && (
            <div className="custom-select-search-wrap custom-select-search-box" onClick={(e) => e.stopPropagation()}>
              <svg className="custom-select-search-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="custom-select-search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightIndex(0);
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="custom-select-search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          )}

          <div className="custom-select-options-list" ref={listRef}>
            {placeholder && !searchQuery && (
              <div
                className={`custom-select-option ${isPlaceholder ? 'selected' : ''}`}
                onClick={() => triggerChange('')}
              >
                <span>{placeholder}</span>
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="custom-select-empty custom-select-no-results">No matches found</div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = highlightIndex === idx;

                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    ref={(el) => (itemRefs.current[idx] = el)}
                    className={`custom-select-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                    onClick={() => triggerChange(opt.value)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                  >
                    <span>{opt.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
