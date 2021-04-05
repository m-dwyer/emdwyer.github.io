import React from "react"
import { css, useTheme } from "@emotion/react"
import { FaPencilAlt, FaTag } from "react-icons/fa"
import NavItem from "./navitem"

const NavBar = props => {
  const theme = useTheme()

  return (
    <nav
      css={css`
        background: ${theme.colors.altBgColor};
        box-shadow: 1px 2px 10px rgba(0, 0, 0, 0.4);
        padding: 0;

        ul {
          margin: 0;
          li {
            padding: 0;
            text-transform: uppercase;
          }
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
            <FaTag size={20} />
            <span>tags</span>
          </NavItem>
        </li>
      </ul>
    </nav>
  )
}

export default NavBar
