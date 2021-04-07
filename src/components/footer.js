import React from "react"
import { css, useTheme } from "@emotion/react"

const Footer = ({ children, ...props }) => {
  const theme = useTheme()
  return (
    <footer
      css={css`
        background: ${theme.colors.altBgColor};
        grid-area: 3/1/4/2;
        padding: 1.5em 1em;

        display: none;

        * + * {
          margin-left: 1.25em;
        }

        @media only screen and (min-width: 700px) {
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `}
      {...props}
    >
      {children}
    </footer>
  )
}

export default Footer
