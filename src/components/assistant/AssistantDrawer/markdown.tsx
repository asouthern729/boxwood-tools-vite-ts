import Markdown, { defaultUrlTransform } from "react-markdown"
import remarkGfm from "remark-gfm"
import { TOOL_LINK_PREFIX, toolLinkPath } from "./utils"
import { ToolLinkButton } from "./messages"

// Types
import type { Components } from "react-markdown"

// boxwood://tool/ links must survive react-markdown's URL sanitising; everything else is sanitised
// as usual. Raw HTML in replies is never rendered (react-markdown's default).
const urlTransform = (url: string) => url.startsWith(TOOL_LINK_PREFIX) ? url : defaultUrlTransform(url)

const components: Components = {
  a: ({ href, children }) => {
    if(href?.startsWith(TOOL_LINK_PREFIX)) {
      const path = toolLinkPath(href)
      // An unknown tool path shows as plain text rather than a dead button
      return path ? <ToolLinkButton path={path}>{children}</ToolLinkButton> : <>{children}</>
    }

    return <a href={href} target="_blank" rel="noopener noreferrer" className="link text-secondary break-all">{children}</a>
  },
  table: ({ children }) => (
    <div className="overflow-x-auto rounded-box border border-base-content/10">
      <table className="table table-xs">{children}</table>
    </div>
  ),
}

// An assistant reply's markdown: lists, bold, pipe tables, and tool links rendered as buttons
function AssistantMarkdown({ text }: { text: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      urlTransform={urlTransform}
      components={components}>
        {text}
    </Markdown>
  )
}

export default AssistantMarkdown
