import React from "react"
import { css } from "@emotion/core"
import { useTheme } from "emotion-theming"
import { Link } from "gatsby"

const Header = ({ logo, children }) => {
  const theme = useTheme()

  return (
    <header
      css={css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        top: 0;
        left: 0;
        margin: 0;
        background-color: ${theme.colors.secondaryBgColor};
        position: fixed;
        width: 100%;
        opacity: 0.9;
        z-index: 1;
        box-shadow: 0px 2px 10px hsl(0, 0%, 15%);
      `}
    >
      <Link to="/">
        <div
          css={css`
            padding: 10px;
            color: ${theme.colors.fontColor};
            display: flex;
            justify-content: center;
            align-items: center;
          `}
        >
          {logo}
          <div
            css={css`
              margin: 0 15px;
            `}
          >
            mdwyer
          </div>
        </div>
      </Link>
      {children}
    </header>
  )
}

export default Header
