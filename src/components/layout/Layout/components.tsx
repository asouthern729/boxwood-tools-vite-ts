import { NavLink } from "react-router"
import magpie from "@assets/magpie.png"
import boxwoodLogo from "@assets/boxwood-logo.png"
import { NAV_LINKS } from "../utils"

export const Header = () => (
  <header className="mx-auto my-12 flex items-center gap-5">
    <img src={boxwoodLogo} alt="Boxwood Insurance Group" className="block h-26 w-auto shrink-0" />
    <div className="text-end">
      <h1>Boxwood Insurance Group</h1>
      <span className="text-neutral-content/70 inline-block -translate-y-4 text-lg font-semibold">Employee Tools</span>
    </div>
  </header>
)

export const Footer = () => (
  <footer>
    <div className="mt-12 border-t border-base-300 pt-5 font-mono text-[0.72rem] tracking-[0.02em] text-base-content/60">
      <nav aria-label="Site pages" className="mb-[0.6rem] flex flex-wrap gap-x-[1.1rem] gap-y-[0.35rem]">
        <FooterNavLinks />
        <a
          href="https://mcp.boxwoodins.com/mcp-tools/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-base-content/60 no-underline hover:underline">
          MCP Tools
        </a>
        <a
          href="https://mcp.boxwoodins.com/ams360-sync/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-base-content/60 no-underline hover:underline">
          AMS360 Sync
        </a>
      </nav>
      Boxwood Tools
    </div>

    <div className="relative h-40 shrink-0 overflow-hidden bg-[linear-gradient(to_right,var(--color-neutral),var(--color-base-300))]">
      <a
        href="https://tyneside.io"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-2 flex flex-col items-center justify-center text-white no-underline"
        style={{
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}>
        <Magpie />
        <span className="text-[0.95rem] font-extrabold tracking-[6px] uppercase sm:text-lg sm:tracking-[10px]">
          Tyneside Innovations
        </span>
        <span className="mt-1 text-[0.8rem] tracking-[4px] uppercase sm:text-base sm:tracking-[8px]">
          Madison, Tennessee
        </span>
      </a>
    </div>
  </footer>
)

const FooterNavLinks = () => (
  <>
    {NAV_LINKS.map(({ to, label }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          isActive
            ? "font-semibold text-base-content no-underline"
            : "text-base-content/60 no-underline hover:underline"
        }>
        {label}
      </NavLink>
    ))}
  </>
)

const Magpie = () => (
  <img
    src={magpie}
    alt=""
    width={164}
    height={144}
    className="absolute right-0 bottom-0 z-1 hidden h-36 w-auto opacity-25 sm:block dark:invert" />
)