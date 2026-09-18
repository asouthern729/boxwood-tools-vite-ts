import { NavLink } from "react-router"
import { NAV_LINKS } from "../utils"

export const NavButtons = () => (
  <div className="join">
    {NAV_LINKS.map(({ to, label }) => (
      <NavBtn 
        to={to} 
        label={label} />
    ))}
  </div>
)

const NavBtn = ({ to, label }: { to: string, label: string }) => (
  <NavLink
    key={to}
    to={to}
    className={({ isActive }) =>
      isActive ? "btn bg-neutral-content text-neutral join-item w-40" : "btn btn-ghost join-item hover:bg-neutral hover:text-neutral-content w-40"}>
        {label}
  </NavLink>
)