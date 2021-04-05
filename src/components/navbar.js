import React from "react"
import { css, useTheme } from "@emotion/react"
import { Link } from "gatsby"

const NavBar = props => {
  const theme = useTheme()

  return (
    <nav
      css={css`
        background: ${theme.colors.altBgColor};
        box-shadow: 1px 2px 10px rgba(0, 0, 0, 0.4);
        ul li {
          padding: 1.5em 2.5em;
          text-transform: uppercase;
        }
      `}
    >
      <ul>
        <li>
          <Link to="/blog">posts</Link>
        </li>
        <li>
          <Link to="/tag">tags</Link>
        </li>
      </ul>
    </nav>
  )
}

export default NavBar
