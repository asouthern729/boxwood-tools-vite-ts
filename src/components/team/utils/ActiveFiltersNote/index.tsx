import { formatRenewalMonth, UNASSIGNED_CSR_LABEL } from "@components/commercial/context/utils"

type ActiveFiltersNoteProps = {
  visible: boolean
  csrName: string
  renewalMonth: string
  onClear: () => void
}

// Calls out the saved CSR and month filters so a narrowed list is never mistaken for missing renewals
function ActiveFiltersNote({ visible, csrName, renewalMonth, onClear }: ActiveFiltersNoteProps) {
  if(!visible || (!csrName && !renewalMonth)) return null

  return (
    <div role="status" className="alert alert-info alert-soft justify-center py-2 text-sm">
      <span>
        Showing {
          csrName === UNASSIGNED_CSR_LABEL ? <><strong>unassigned</strong> renewals</> :
          csrName ? <><strong>{csrName}</strong>'s renewals</> :
          "renewals"
        }
        {renewalMonth && <> for <strong>{formatRenewalMonth(renewalMonth)}</strong></>}
      </span>
      <button
        type="button"
        onClick={onClear}
        className="btn btn-link btn-xs">
        Clear filters
      </button>
    </div>
  )
}

export default ActiveFiltersNote
