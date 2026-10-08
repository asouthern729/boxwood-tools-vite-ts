type CreatedTodayFilterProps = {
  count: number
  active: boolean
  disabled?: boolean
  onChange: (active: boolean) => void
}

function CreatedTodayFilter({ count, active, disabled, onChange }: CreatedTodayFilterProps) {
  if(count === 0) return null

  const btnStyle = active ? "btn-neutral" : "btn-success"
  const btnContent = active ? "Show All" : `Created Today (${ count })`

  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={() => onChange(!active)}
      className={`btn btn-sm rounded-sm ${ btnStyle }`}>
        {btnContent}
    </button>
  )
}

export default CreatedTodayFilter
