import React from "react"
import { css, useTheme } from "@emotion/react"
import { Link } from "gatsby"
import { FaPencilAlt, FaTag, FaTags } from "react-icons/fa"
import NavItem from "./navitem"

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
          <NavItem to="/blog">
            <FaPencilAlt size={20} />
            <span>posts</span>
          </NavItem>
        </li>
        <li>
          <NavItem to="/tag">
            <FaTags size={20} />
            <span>tags</span>
          </NavItem>
        </li>
      </ul>
    </nav>
  )
}

export default NavBar
