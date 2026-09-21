export type OrderingOption = {
  value: string
  label: string
}

type OrderingProps = {
  value: string
  onChange: (value: string) => void
  options: OrderingOption[]
}

function Ordering({ value, onChange, options }: OrderingProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="select select-bordered select-sm w-fit">
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  )
}

export default Ordering
