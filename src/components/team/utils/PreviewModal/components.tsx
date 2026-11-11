export const ModalActions = ({ children }: { children?: React.ReactNode }) => (
  <div className="modal-action">
    {children}
    <form method="dialog">
      <button type="submit" className="btn">Close</button>
    </form>
  </div>
)

export const ModalBackdrop = () => (
  <form method="dialog" className="modal-backdrop">
    <button type="submit">close</button>
  </form>
)
