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
        z-index: 100;

        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;

        ul {
          margin: 0;

          display: flex;
          justify-content: center;

          li {
            padding: 0;
            text-transform: uppercase;

            span {
              display: none;
            }

            :hover {
              background: ${theme.colors.bgColor};
            }
          }
        }

        @media only screen and (min-width: 700px) {
          transition: width 0.2s ease;
          position: initial;
          width: 5em;

          ul {
            display: flex;
            flex-direction: column;
          }

          span {
            padding-left: 0.75em;
          }

          :hover {
            width: 10em;

            span {
              display: inline;
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
