import React from "react"
import { css, useTheme } from "@emotion/react"

const Header = ({ children }) => {
  const theme = useTheme()

  return (
    <header
      css={css`
        background: ${theme.colors.altBgColor};
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
