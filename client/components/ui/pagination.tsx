import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const [inputValue, setInputValue] = useState("");
  const [showInput, setShowInput] = useState(false);

  if (totalPages <= 1) return null;

  const handleInputSubmit = () => {
    const page = parseInt(inputValue);
    if (page && page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
    setShowInput(false);
    setInputValue("");
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleInputSubmit();
    } else if (e.key === "Escape") {
      setShowInput(false);
      setInputValue("");
    }
  };

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 3; // Show first 3 pages

    // Always show first few pages
    for (let i = 1; i <= Math.min(maxVisible, totalPages); i++) {
      pages.push(i);
    }

    // Add ellipsis if there are more pages
    if (totalPages > maxVisible + 1) {
      pages.push("...");
    }

    // Always show last page if it's not already shown
    if (totalPages > maxVisible && totalPages !== maxVisible + 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div
      className={cn("flex items-center justify-center gap-1 mt-6", className)}
    >
      {/* Previous Button - only show from page 2 onwards */}
      {currentPage > 1 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          className="mr-2"
        >
          Anterior
        </Button>
      )}

      {/* Page Numbers */}
      {visiblePages.map((page, index) => (
        <React.Fragment key={index}>
          {typeof page === "number" ? (
            <Button
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={cn(
                "min-w-[40px]",
                currentPage === page && "bg-black text-white hover:bg-gray-800",
              )}
            >
              {page}
            </Button>
          ) : (
            <div
              className="relative"
              onMouseEnter={() => setShowInput(true)}
              onMouseLeave={() => {
                if (!inputValue) setShowInput(false);
              }}
            >
              {showInput ? (
                <div className="flex items-center gap-1 bg-white border rounded px-2 py-1">
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleInputKeyPress}
                    onBlur={() => {
                      if (!inputValue) setShowInput(false);
                    }}
                    placeholder="Página"
                    className="w-16 text-sm text-center border-none outline-none"
                    min="1"
                    max={totalPages}
                    autoFocus
                  />
                  <button
                    onClick={handleInputSubmit}
                    className="text-xs bg-black text-white px-2 py-1 rounded hover:bg-gray-800"
                  >
                    Ir
                  </button>
                </div>
              ) : (
                <span className="px-2 py-1 text-gray-500 cursor-pointer hover:text-black">
                  ...
                </span>
              )}
            </div>
          )}
        </React.Fragment>
      ))}

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="ml-2"
      >
        Próximo
      </Button>
    </div>
  );
}
