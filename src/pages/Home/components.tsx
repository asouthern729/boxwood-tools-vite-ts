import { Link } from "react-router"
import { NAV_LINKS } from "@components/layout/utils"

export const HomeBtns = () => (
  <div className="flex flex-wrap justify-center gap-4">
    {NAV_LINKS.map(({ to, label }) => (
      <Link 
        key={to} 
        to={to} 
        className="btn btn-lg bg-neutral-content text-neutral rounded-sm w-50 hover:bg-neutral hover:text-neutral-content">
          {label}
      </Link>
    ))}
  </div>
)