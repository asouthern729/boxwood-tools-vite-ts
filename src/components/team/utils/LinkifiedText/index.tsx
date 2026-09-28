import { linkify } from "./utils"

function LinkifiedText({ text }: { text: string }) {
  return (
    <>
      {linkify(text).map((segment, i) => (
        typeof segment === "string" ?
          segment :
          <a
            key={i}
            href={segment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link text-secondary break-all">
              {segment.url}
          </a>
      ))}
    </>
  )
}

export default LinkifiedText
