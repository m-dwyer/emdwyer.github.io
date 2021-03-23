import React, { useContext, useEffect, useState } from "react"
import { css } from "@emotion/core"
import { FaArrowDown } from "react-icons/fa"
import { NavContext } from "./layout"
import { motion, AnimatePresence } from "framer-motion"

const Hero = () => {
  const { navItems } = useContext(NavContext)

  let callToActionRef = null

  useEffect(() => {
    if (navItems && navItems.length > 0) {
      callToActionRef = navItems.find(i => i.label === "About").ref
    }
  }, [navItems])

  const scrollToContent = () => {
    callToActionRef.current.scrollIntoView({
      block: "start",
      behavior: "smooth",
    })
  }

  return (
    <>
      <h1>Hi, I'm mdwyer</h1>
      <div
        css={css`
          @keyframes call-to-action {
            0% {
              transform: translate(0, 0rem);
            }

            50% {
              transform: translate(0, 0.5rem);
            }

            100% {
              transform: translate(0, 0rem);
            }
          }

          font-size: 5rem;

          animation-name: call-to-action;
          animation-duration: 1s;
          animation-iteration-count: infinite;
        `}
      >
        <button
          css={css`
            border: 0;
            border-radius: 50%;
            height: 80px;
            width: 80px;
            cursor: pointer;
          `}
          onClick={scrollToContent}
        >
          <FaArrowDown size={60} />
        </button>
      </div>
    </>
  )
}

export default Hero