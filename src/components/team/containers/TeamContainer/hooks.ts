import { useLocation } from "react-router"
import { teamNavDescriptions } from "./utils"

// Components
import SlideInLeft from "@utils/animations/SlideInLeft"
import SlideInRight from "@utils/animations/SlideInRight"

export const useHandleNavBtns = () => {
  const { pathname } = useLocation()

  const team = pathname.startsWith("/commercial") ?
    "commercial" :
    "personal"

  const descriptions = team === "commercial" ?
    teamNavDescriptions[0] :
    teamNavDescriptions[1]

  const Animation = team === "commercial" ?
    SlideInLeft :
    SlideInRight

  return { descriptions, Animation }
}