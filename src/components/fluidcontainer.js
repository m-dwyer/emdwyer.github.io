import React from "react"
import { css } from "@emotion/react"

const FluidContainer = ({ children }) => {
  return (
    <div
      css={css`
        margin: 0 auto;
        padding: 2.5rem 1.3rem;
        max-width: 85%;
      `}
    >
      {children}
    </div>
  )
}

export default FluidContainer
