type TodayFilterProps = {
  label: string
  count: number
  active: boolean
  disabled?: boolean
  btnStyle?: string
  onChange: (active: boolean) => void
}

function TodayFilter({ label, count, active, disabled, btnStyle = "btn-success", onChange }: TodayFilterProps) {
  if(count === 0) return null

  const activeStyle = active ? "btn-neutral" : btnStyle
  const btnContent = active ? "Show All" : `${ label } (${ count })`

  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={() => onChange(!active)}
      className={`btn btn-sm rounded-sm ${ activeStyle }`}>
        {btnContent}
    </button>
  )
}

export default TodayFilter
