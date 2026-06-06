"use client";

import React from "react";

export interface Author {
  name: string;
  email: string;
  university: string;
  isMain: boolean;          // Primary / first author of the paper
  isCorresponding: boolean; // Handles communications with the journal
  order?: number;
}

interface AuthorsManagerProps {
  authors: Author[];
  onChange: (authors: Author[]) => void;
  validationErrors?: Record<string, string>;
  isEditing?: boolean;
}

export default function AuthorsManager({
  authors,
  onChange,
  validationErrors = {},
  isEditing = true,
}: AuthorsManagerProps) {
  const addAuthor = () => {
    const isFirst = authors.length === 0;
    onChange([
      ...authors,
      {
        name: "",
        email: "",
        university: "",
        isMain: isFirst,
        isCorresponding: isFirst,
      },
    ]);
  };

  const removeAuthor = (index: number) => {
    const newAuthors = [...authors];
    const removed = newAuthors.splice(index, 1)[0];

    if (newAuthors.length > 0) {
      // If removed author was the main author, promote first remaining
      if (removed.isMain) newAuthors[0].isMain = true;
      // If removed author was the corresponding author, promote first remaining
      if (removed.isCorresponding) newAuthors[0].isCorresponding = true;
    }

    onChange(newAuthors);
  };

  const updateAuthor = (index: number, field: keyof Author, value: any) => {
    const newAuthors = authors.map((author, idx) => {
      // For radio-type fields: clear the flag on all others first
      if ((field === "isMain" || field === "isCorresponding") && value === true && idx !== index) {
        return { ...author, [field]: false };
      }
      if (idx !== index) return author;
      return { ...author, [field]: value };
    });
    onChange(newAuthors);
  };

  const moveAuthor = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === authors.length - 1) return;

    const newAuthors = [...authors];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newAuthors[index], newAuthors[targetIndex]] = [newAuthors[targetIndex], newAuthors[index]];
    onChange(newAuthors);
  };

  // ── Read-only view ────────────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <div className="space-y-3">
        {authors.map((author, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-gray-900 truncate">
                  {author.name || <span className="text-gray-400 italic">Unnamed Author</span>}
                </span>
                {author.isMain && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                    Main Author
                  </span>
                )}
                {author.isCorresponding && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Corresponding Author
                  </span>
                )}
              </div>
              {author.email && (
                <p className="text-xs text-gray-500 truncate mt-0.5">{author.email}</p>
              )}
              {author.university && (
                <p className="text-xs text-gray-600 truncate mt-0.5">{author.university}</p>
              )}
            </div>
          </div>
        ))}
        {authors.length === 0 && (
          <p className="text-gray-500 italic text-center py-4">No authors listed.</p>
        )}
      </div>
    );
  }

  // ── Edit view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800">Author Sequence & Roles</h3>
        <button
          type="button"
          onClick={addAuthor}
          className="inline-flex items-center px-3.5 py-1.5 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
        >
          <span className="mr-1">+</span> Add Author
        </button>
      </div>

      <div className="space-y-4">
        {authors.map((author, index) => {
          const nameError = validationErrors[`coAuthor_${index}_name`] || validationErrors[`author_${index}_name`];
          const emailError = validationErrors[`coAuthor_${index}_email`] || validationErrors[`author_${index}_email`];
          const universityError = validationErrors[`coAuthor_${index}_university`] || validationErrors[`author_${index}_university`];

          return (
            <div
              key={index}
              className="relative p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* ── Card header: number + title + actions ── */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold text-gray-700">
                    Author #{index + 1}
                  </span>
                  {author.isMain && (
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Main Author
                    </span>
                  )}
                  {author.isCorresponding && (
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Corresponding
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveAuthor(index, "up")}
                    className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Move Up"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={index === authors.length - 1}
                    onClick={() => moveAuthor(index, "down")}
                    className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Move Down"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAuthor(index)}
                    className="ml-2 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* ── Input fields ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={author.name}
                    onChange={(e) => updateAuthor(index, "name", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-accent focus:border-transparent ${
                      nameError ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="Full Name"
                  />
                  {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={author.email}
                    onChange={(e) => updateAuthor(index, "email", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-accent focus:border-transparent ${
                      emailError ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="email@example.com"
                  />
                  {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Affiliation / University <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={author.university}
                    onChange={(e) => updateAuthor(index, "university", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-accent focus:border-transparent ${
                      universityError ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="University Name"
                  />
                  {universityError && <p className="text-red-500 text-xs mt-1">{universityError}</p>}
                </div>
              </div>

              {/* ── Role designations ── */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-3 border-t border-gray-100">
                {/* Main Author radio */}
                <label className="inline-flex items-center cursor-pointer text-sm text-gray-700 select-none">
                  <input
                    type="radio"
                    name="main_author_selector"
                    checked={author.isMain}
                    onChange={() => updateAuthor(index, "isMain", true)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="ml-2 font-semibold flex items-center gap-1">
                    Main Author
                    <span className="text-xs text-gray-400 font-normal">(Primary researcher)</span>
                  </span>
                </label>

                {/* Corresponding Author radio */}
                <label className="inline-flex items-center cursor-pointer text-sm text-gray-700 select-none">
                  <input
                    type="radio"
                    name="corresponding_author_selector"
                    checked={author.isCorresponding}
                    onChange={() => updateAuthor(index, "isCorresponding", true)}
                    className="h-4 w-4 text-accent border-gray-300 focus:ring-accent"
                  />
                  <span className="ml-2 font-semibold flex items-center gap-1">
                    Corresponding Author
                    <span className="text-xs text-gray-400 font-normal">(Primary contact for paper communications)</span>
                  </span>
                </label>
              </div>
            </div>
          );
        })}

        {authors.length === 0 && (
          <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
            <svg
              className="mx-auto h-10 w-10 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500 font-medium">No authors listed</p>
            <p className="text-xs text-gray-400 mt-0.5">Please add at least one author to this manuscript.</p>
            <button
              type="button"
              onClick={addAuthor}
              className="mt-3 inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
            >
              + Add First Author
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
