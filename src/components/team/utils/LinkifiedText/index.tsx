import { linkify } from "./utils"

// Components
import * as Components from "./components"

function LinkifiedText({ text }: { text: string }) {
  return (
    <>
      {linkify(text).map((segment, i) => (
        typeof segment === "string" ?
          segment :
          <Components.ExternalLink
            key={i}
            url={segment.url} />
      ))}
    </>
  )
}

export default LinkifiedText
