import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function SearchForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const termInUrl = searchParams.get('q') ?? '';
  const [term, setTerm] = useState(termInUrl);

  useEffect(() => {
    setTerm(termInUrl);
  }, [termInUrl]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = term.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <form className="search-form" role="search" onSubmit={handleSubmit}>
      <input
        type="search"
        aria-label="Search products"
        placeholder="Search products"
        maxLength={100}
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  );
}
