import React from "react"
import { css, useTheme, keyframes } from "@emotion/react"
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
        transition: width 0.2s ease;
        width: 5em;

        :hover {
          width: 10em;

          span {
            display: inline;
          }
        }

        ul {
          margin: 0;
          li {
            padding: 0;
            text-transform: uppercase;

            :hover {
              background: ${theme.colors.bgColor};
            }

            span {
              padding-left: 1em;
              display: none;
            }
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
