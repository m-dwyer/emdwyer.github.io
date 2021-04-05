import React from "react"
import { css } from "@emotion/react"

const IndexSection = ({ children, ...props }) => {
  return (
    <section
      css={css`
        display: flex;
        flex-direction: column;
        width: 100%;
        min-height: 100vh;
        justify-content: center;
        align-items: center;
        margin: auto;
      `}
      {...props}
    >
      {children}
    </section>
  )
}

export default IndexSection
