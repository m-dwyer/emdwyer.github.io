import React, { useState } from "react"
import { css, useTheme } from "@emotion/react"
import { Link } from "gatsby"

const NavBar = props => {
  const theme = useTheme()

  const [visible, setVisible] = useState(false)

  const toggleMenu = () => {
    setVisible(!visible)
  }

  return (
    <nav
      css={css`
        background: ${theme.colors.altBgColor};
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
