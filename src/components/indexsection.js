import React from "react"
import { css } from "@emotion/react"

import ScrollableSection from "./ScrollableSection"

const IndexSection = ({ children, ...props }) => {
  return (
    <ScrollableSection
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
    </ScrollableSection>
  )
}

export default IndexSection
