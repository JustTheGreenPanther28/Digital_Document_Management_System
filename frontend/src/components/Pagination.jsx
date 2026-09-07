import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 6,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [6, 12, 24],
  itemLabel = 'items'
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  if (totalItems <= pageSize && (!pageSizeOptions || pageSizeOptions.length <= 1)) {
    return null;
  }

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, safeCurrentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="obsidian-card p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none border border-white/[0.06]">
      {/* 1. Item Counter Info */}
      <div className="text-slate-400 font-mono flex items-center gap-1.5">
        <span>Showing</span>
        <span className="text-white font-bold">{startItem}</span>
        <span>-</span>
        <span className="text-white font-bold">{endItem}</span>
        <span>of</span>
        <span className="text-violet-400 font-bold">{totalItems}</span>
        <span>{itemLabel}</span>
      </div>

      {/* 2. Controls (Page Size & Buttons) */}
      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
            <span className="hidden md:inline">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                if (onPageChange) onPageChange(1);
              }}
              className="bg-[#121524] border border-white/[0.1] rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              {pageSizeOptions.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 3. Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => onPageChange && onPageChange(1)}
            className="p-1.5 rounded-lg bg-[#121524] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-[#181D33] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => onPageChange && onPageChange(safeCurrentPage - 1)}
            className="p-1.5 rounded-lg bg-[#121524] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-[#181D33] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 mx-1">
            {getPageNumbers().map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onPageChange && onPageChange(num)}
                className={`min-w-[28px] h-7 px-2 rounded-lg font-mono text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                  num === safeCurrentPage
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-400/40'
                    : 'bg-[#121524] text-slate-400 hover:text-white hover:bg-[#181D33] border border-white/[0.06]'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => onPageChange && onPageChange(safeCurrentPage + 1)}
            className="p-1.5 rounded-lg bg-[#121524] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-[#181D33] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => onPageChange && onPageChange(totalPages)}
            className="p-1.5 rounded-lg bg-[#121524] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-[#181D33] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
