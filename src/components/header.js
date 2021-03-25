import React from "react"
import { css, useTheme } from "@emotion/react"
import { Link } from "gatsby"

const Header = ({ logo, children }) => {
  const theme = useTheme()

  return (
    <header
      css={css`s
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
      <div
        css={css`
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1;
          padding: 0 2em;
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
      </div>
    </header>
  )
}

export default Header
