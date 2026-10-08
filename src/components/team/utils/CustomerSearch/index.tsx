type CustomerSearchProps = {
  value: string
  onChange: (value: string) => void
}

function CustomerSearch({ value, onChange }: CustomerSearchProps) {
  return (
    <label className="input input-sm w-full rounded-sm sm:w-64">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 opacity-50">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
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
