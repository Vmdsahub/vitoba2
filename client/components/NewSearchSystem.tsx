import React, { useState, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  id: string;
  title: string;
  category: string;
  author: string;
  categoryType: "tools" | "opensource";
}

interface NewSearchSystemProps {
  activeSection?: "newsletter" | "forum";
}

export default function NewSearchSystem({
  activeSection,
}: NewSearchSystemProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Top level filters
  const [filterTools, setFilterTools] = useState(true);
  const [filterOpenSource, setFilterOpenSource] = useState(true);
  const [filterUsers, setFilterUsers] = useState(false);

  // Category filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "llms",
    "imagem",
    "video",
    "musica-audio",
    "vibe-coding",
    "duvidas-erros",
    "projetos-comunidade",
    "outros",
    "pedidos",
  ]);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const categories = [
    { id: "llms", name: "LLMs" },
    { id: "imagem", name: "Imagem" },
    { id: "video", name: "Vídeo" },
    { id: "musica-audio", name: "Música/Áudio" },
    { id: "vibe-coding", name: "Vibe Coding" },
    { id: "duvidas-erros", name: "Dúvidas/Erros" },
    { id: "projetos-comunidade", name: "Projetos da comunidade" },
    { id: "outros", name: "Outros" },
    { id: "pedidos", name: "Pedidos" },
  ];

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle user filter logic
  const handleUserFilterChange = (checked: boolean) => {
    setFilterUsers(checked);
    if (checked) {
      // If users is checked, uncheck others
      setFilterTools(false);
      setFilterOpenSource(false);
    }
  };

  const handleToolsFilterChange = (checked: boolean) => {
    setFilterTools(checked);
    if (checked && filterUsers) {
      // If tools is checked and users was checked, uncheck users
      setFilterUsers(false);
    }
  };

  const handleOpenSourceFilterChange = (checked: boolean) => {
    setFilterOpenSource(checked);
    if (checked && filterUsers) {
      // If opensource is checked and users was checked, uncheck users
      setFilterUsers(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  // Search function
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Don't search if no filters are selected
    if (!filterUsers && !filterTools && !filterOpenSource) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Build search parameters
      const params = new URLSearchParams();
      params.append("q", query);

      if (filterUsers) {
        params.append("type", "users");
      } else {
        // Build category filters for topics
        const searchCategories: string[] = [];

        if (filterTools) {
          selectedCategories.forEach((cat) => {
            searchCategories.push(cat);
          });
        }

        if (filterOpenSource) {
          selectedCategories.forEach((cat) => {
            searchCategories.push(`opensource-${cat}`);
          });
        }

        searchCategories.forEach((cat) => params.append("categories", cat));
        params.append("type", "topics");
      }

      const response = await fetch(`/api/search?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    searchQuery,
    filterTools,
    filterOpenSource,
    filterUsers,
    selectedCategories,
  ]);

  const handleResultClick = (result: SearchResult) => {
    if (filterUsers) {
      // Navigate to user profile or handle user result
      console.log("User clicked:", result);
    } else {
      // Navigate to topic
      navigate(`/topic/${result.id}`);
    }
    setIsDropdownOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Only show in forum section
  if (activeSection !== "forum") {
    return null;
  }

  return (
    <div ref={searchRef} className="flex-1 relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar tópicos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsDropdownOpen(true)}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
        </div>
      </div>

      {/* Dropdown with filters and results */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Filters Section */}
          <div className="p-4 border-b border-gray-100">
            {/* Top level filters */}
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-tools"
                    checked={filterTools}
                    onCheckedChange={handleToolsFilterChange}
                  />
                  <label htmlFor="filter-tools" className="text-sm font-medium">
                    Ferramentas
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-opensource"
                    checked={filterOpenSource}
                    onCheckedChange={handleOpenSourceFilterChange}
                  />
                  <label
                    htmlFor="filter-opensource"
                    className="text-sm font-medium"
                  >
                    Open Source
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-users"
                    checked={filterUsers}
                    onCheckedChange={handleUserFilterChange}
                  />
                  <label htmlFor="filter-users" className="text-sm font-medium">
                    Usuários
                  </label>
                </div>
              </div>

              {/* Category filters - only show if not searching users */}
              {!filterUsers && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">Categorias:</div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryToggle(category.id)}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${
                          selectedCategories.includes(category.id)
                            ? "bg-gray-800 text-white border-gray-800"
                            : "bg-gray-100 text-gray-600 border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mx-auto mb-2"></div>
                Buscando...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 mb-1">
                      {result.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {result.category} • por {result.author}
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <div className="p-4 text-center text-gray-500">
                Nenhum resultado encontrado
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
