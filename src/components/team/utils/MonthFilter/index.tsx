import { upcomingRenewalMonths } from "@components/commercial/context/utils"

type MonthFilterProps = {
  value: string
  onChange: (value: string) => void
  disabled: boolean
}

function MonthFilter({ value, onChange, disabled }: MonthFilterProps) {
  const months = upcomingRenewalMonths()

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label="Renewal month"
      className="select select-bordered select-sm w-fit">
      <option value="">All Renewal Months</option>
      {months.map((month, index) => (
        <option key={month.value} value={month.value}>{index === 0 ? `Renewing ${ month.label }` : month.label}</option>
      ))}
    </select>
  )
}

export default MonthFilter
