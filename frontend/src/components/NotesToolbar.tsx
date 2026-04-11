import React from 'react';

interface NotesToolbarProps {
  searchTerm: string;
  activeTag: string;
  activeCategory: string;
  availableTags: string[];
  availableCategories: string[];
  visibleCount: number;
  totalCount: number;
  onSearchTermChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onExportJson: () => void;
  onExportPdf: () => void;
}

export default function NotesToolbar({
  searchTerm,
  activeTag,
  activeCategory,
  availableTags,
  availableCategories,
  visibleCount,
  totalCount,
  onSearchTermChange,
  onTagChange,
  onCategoryChange,
  onExportJson,
  onExportPdf,
}: NotesToolbarProps) {
  return (
    <section className="panel toolbar-panel">
      <h2>Explore Notes</h2>
      <div className="toolbar-grid">
        <label>
          Search
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search title or content"
          />
        </label>

        <label>
          Tag
          <select value={activeTag} onChange={(event) => onTagChange(event.target.value)}>
            <option value="">All tags</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>

        <label>
          Category
          <select value={activeCategory} onChange={(event) => onCategoryChange(event.target.value)}>
            <option value="">All categories</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="toolbar-footer">
        <p className="muted">
          Showing {visibleCount} of {totalCount} notes
        </p>
        <div className="actions-row">
          <button type="button" className="secondary" onClick={onExportJson} disabled={visibleCount === 0}>
            Export JSON
          </button>
          <button type="button" className="secondary" onClick={onExportPdf} disabled={visibleCount === 0}>
            Export PDF
          </button>
        </div>
      </div>
    </section>
  );
}
