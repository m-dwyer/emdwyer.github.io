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
        z-index: 100;

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

        @media only screen and (max-width: 700px) {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;

          ul {
            display: flex;
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
