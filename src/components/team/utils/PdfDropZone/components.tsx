import { acceptAttribute } from "./utils"

// Types
import type { DropFileKind } from "./utils"

type HiddenFileInputProps = {
  inputRef: React.RefObject<HTMLInputElement | null>
  accept: DropFileKind[]
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

export const HiddenFileInput = ({ inputRef, accept, onChange }: HiddenFileInputProps) => (
  <input
    ref={inputRef}
    type="file"
    accept={acceptAttribute(accept)}
    multiple
    hidden
    onChange={onChange} />
)
