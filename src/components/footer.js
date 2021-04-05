import React from "react"
import { css, useTheme } from "@emotion/react"

const Footer = ({ children }) => {
  const theme = useTheme()
  return (
    <footer
      css={css`
        background: ${theme.colors.altBgColor};
        grid-area: 3/1/4/2;
      `}
    >
      {children}
    </footer>
  )
}

export default Footer
