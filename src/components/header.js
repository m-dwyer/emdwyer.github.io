import React from "react"
import { css, useTheme } from "@emotion/react"

const Header = ({ children }) => {
  const theme = useTheme()

  return (
    <header
      css={css`
        background: ${theme.colors.altBgColor};
        box-shadow: 2px 1px 10px rgba(0, 0, 0, 0.4);
        z-index: 100;
        padding: 1.5em 1em;
        grid-area: 1/1/2/2;

        display: flex;
        justify-content: space-between;
      `}
    >
      {children}
    </header>
  )
}

export default Header
