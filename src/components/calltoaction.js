import React from "react"
import { css } from "@emotion/core"
import { FaArrowDown } from "react-icons/fa"

const CallToAction = () => {
  return (
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
      <FaArrowDown size={60} />
    </div>
  )
}

export default CallToAction
