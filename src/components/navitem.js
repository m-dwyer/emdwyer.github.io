import React from "react"
import { css } from "@emotion/react"
import { Link } from "gatsby"

const NavItem = ({ children, ...props }) => {
  return (
    <Link
      {...props}
      css={css`
        display: inline-block;
        margin: 0;
        padding: 1.25em 1.25em;

        @media only screen and (min-width: 700px) {
          padding: 2em 2em;
        }
      `}
    >
      <div
        css={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          height: 2em;
          font-size: 1.25em;
        `}
      >
        {children}
      </div>
    </Link>
  )
}

export default NavItem
