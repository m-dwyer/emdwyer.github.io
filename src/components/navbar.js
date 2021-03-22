import React, { useContext } from "react"
import { css } from "@emotion/core"
import { useTheme } from "emotion-theming"

import { NavContext } from "./layout"

const NavBar = ({ children }) => {
  const theme = useTheme()

  const { navItems } = useContext(NavContext)

  const scrollIntoView = ref => {
    ref.current.scrollIntoView({
      block: "start",
      behavior: "smooth",
    })
  }

  return (
    <nav>
      <ul
        css={css`
          display: flex;
          justify-content: flex-end;
          list-style-type: none;

          li {
            cursor: pointer;
            padding: 0.5em;
            text-decoration: none;
            color: ${theme.colors.fgColor};
            &:hover {
              color: ${theme.colors.fontColor};
              font-weight: bold;
            }
          }
        `}
      >
        {navItems.map(v => (
          <li key={v.label} onClick={() => scrollIntoView(v.ref)}>
            {v.label}
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default NavBar
