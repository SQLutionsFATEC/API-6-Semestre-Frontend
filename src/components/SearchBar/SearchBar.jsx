import { FiSearch } from "react-icons/fi";
import "./SearchBar.css";

function SearchBar({ value, onChange }) {
  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Pesquisar documentos..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      <button type="button" className="search-button" aria-label="Pesquisar">
        <FiSearch size={18} />
      </button>
    </div>
  );
}

export default SearchBar;