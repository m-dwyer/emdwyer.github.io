import React from "react"
import { css } from "@emotion/react"

const Body = ({ children }) => {
  return (
    <div
      css={css`
        display: grid;
        grid-template-columns: auto 1fr;
        overflow: hidden;
      `}
    >
      {children}
    </div>
  )
}

export default Body
