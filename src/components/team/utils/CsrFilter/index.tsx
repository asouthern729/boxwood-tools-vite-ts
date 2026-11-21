// Types
import type { OrderingOption } from "@components/team/utils/Ordering"

type CsrFilterProps = {
  value: string
  onChange: (value: string) => void
  options: OrderingOption[]
  disabled: boolean
}

function CsrFilter({ value, onChange, options, disabled }: CsrFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label="CSR"
      className="select select-bordered select-sm w-fit">
      <option value="">All CSRs</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  )
}

export default CsrFilter
