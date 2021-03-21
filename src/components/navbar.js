import React from "react"
import { Link } from "gatsby"
import { css } from "@emotion/core"

const NavBar = ({ children }) => {
  return (
    <nav>
      <ul
        css={theme => css`
          display: flex;
          justify-content: flex-end;
          list-style-type: none;

          li .nav-item {
            padding: 24px;
            text-decoration: none;
            color: ${theme.colors.fgColor};
            &:hover {
              color: ${theme.colors.fontColor};
            }
          }
        `}
      >
        <li>
          <Link to="/" className="nav-item">
            Home
          </Link>
        </li>
        <li>
          <Link to="/blog" className="nav-item">
            Blog
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export default NavBar
