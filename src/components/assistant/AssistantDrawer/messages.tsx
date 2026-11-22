import { Link } from "react-router"
import boxwoodLogo from "@assets/boxwood-logo.png"

// The building blocks of an assistant conversation. The real chat will render the model's markdown
// into AssistantMessage, turning boxwood://tool/<path> links into ToolLinkButtons.

export const LogoDisc = ({ size }: { size: string }) => (
  <span className={`flex ${ size } shrink-0 items-center justify-center rounded-full bg-white`}>
    <img src={boxwoodLogo} alt="" className="size-[85%]" />
  </span>
)

export const UserMessage = ({ children }: { children: React.ReactNode }) => (
  <div className="flex justify-end">
    <div className="max-w-[85%] rounded-box rounded-tr-none bg-primary px-3 py-2 text-sm whitespace-pre-wrap break-words text-primary-content">
      {children}
    </div>
  </div>
)

export const AssistantMessage = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-2">
    <LogoDisc size="size-8" />
    <div className="flex min-w-0 flex-col gap-2 rounded-box rounded-tl-none bg-base-200 p-3 text-sm [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1 [&_p:has(>a.btn)]:flex [&_p:has(>a.btn)]:flex-col">
      {children}
    </div>
  </div>
)

// A recommended tool page, from a boxwood://tool/<path> link in the reply
export const ToolLinkButton = ({ path, children }: { path: string, children: React.ReactNode }) => (
  <Link
    to={`/${ path }`}
    className="btn btn-sm btn-primary btn-outline h-auto w-full justify-center bg-base-100 py-1.5 text-center normal-case no-underline hover:bg-primary hover:text-primary-content">
      {children}
  </Link>
)

// Shown while a reply is streaming in, before its first words arrive
export const TypingIndicator = () => (
  <div className="flex items-start gap-2">
    <LogoDisc size="size-8" />
    <div className="rounded-box rounded-tl-none bg-base-200 px-3 py-2.5">
      <span className="loading loading-dots loading-sm text-primary" aria-label="Boxwood Assistant is typing" />
    </div>
  </div>
)
