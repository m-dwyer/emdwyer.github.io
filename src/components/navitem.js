import React from "react"
import { css } from "@emotion/react"
import { Link } from "gatsby"

const NavItem = ({ children, ...props }) => {
  return (
    <Link {...props}>
      <div
        css={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          font-size: 1.25em;
        `}
      >
        {children}
      </div>
    </Link>
  )
}

export default NavItem
