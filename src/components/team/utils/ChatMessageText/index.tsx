import { parseChatSegments } from "./utils"

// Components
import LinkifiedText from "@components/team/utils/LinkifiedText"
import * as Components from "./components"

function ChatMessageText({ text }: { text: string }) {
  return (
    <>
      {parseChatSegments(text).map((segment, i) => (
        segment.type === "text" ?
          <LinkifiedText key={i} text={segment.text} /> :
          <Components.ChatTable
            key={i}
            header={segment.header}
            align={segment.align}
            rows={segment.rows} />
      ))}
    </>
  )
}

export default ChatMessageText
