// Types
import type { TableAlign } from "./utils"

// Components
import LinkifiedText from "@components/team/utils/LinkifiedText"

type ChatTableProps = {
  header: string[]
  align: TableAlign[]
  rows: string[][]
}

export const ChatTable = ({ header, align, rows }: ChatTableProps) => (
  <div className="my-1 overflow-x-auto rounded-box border border-base-content/10 whitespace-normal">
    <table className="table table-xs">
      <thead>
        <tr>
          {header.map((cell, col) => (
            <th key={col} style={{ textAlign: align[col] }}>
              <LinkifiedText text={cell} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            {row.map((cell, col) => (
              <td key={col} style={{ textAlign: align[col] }}>
                <LinkifiedText text={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
