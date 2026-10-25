// Components
import * as Components from "./components"

type CustomerSearchProps = {
  value: string
  onChange: (value: string) => void
}

function CustomerSearch({ value, onChange }: CustomerSearchProps) {
  return (
    <label className="input input-sm w-full rounded-sm sm:w-64">
      <Components.SearchIcon />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if(e.key === "Escape") onChange("") }}
        placeholder="Search customer or policy #…"
        aria-label="Search by customer name or policy number" />
    </label>
  )
}

export default CustomerSearch
