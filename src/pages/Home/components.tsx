import { Link } from "react-router"
import { NAV_LINKS } from "@components/layout/utils"

// Components
import FadeIn from "../../utils/animations/FadeIn"
import SlideInLeft from "../../utils/animations/SlideInLeft"
import SlideInRight from "../../utils/animations/SlideInRight"

export const HomeBtns = () => (
  <div className="join justify-center">
    {NAV_LINKS.map(({ to, label }, index) => {
      const SlideIn = index === 0 ? SlideInLeft : SlideInRight

      return (
        <FadeIn key={to} duration={1}>
          <SlideIn>
            <Link
              to={to}
              className="btn btn-lg join-item bg-neutral-content text-neutral w-50 hover:bg-neutral hover:text-neutral-content">
                {label}
            </Link>
          </SlideIn>
        </FadeIn>
      )
    })}
  </div>
)