import React, { useContext, useState } from "react"
import { css } from "@emotion/core"
import { useTheme } from "emotion-theming"

import { NavContext } from "./layout"

import HamburgerIcon from "../assets/hamburger.svg"
import CloseIcon from "../assets/closemenu.svg"

const NavBar = ({ children }) => {
  const theme = useTheme()

  const { navItems } = useContext(NavContext)

  const scrollIntoView = ref => {
    ref.current.scrollIntoView({
      block: "start",
      behavior: "smooth",
    })
  }

  const [visible, setVisible] = useState(false)

  const toggleMenu = () => {
    setVisible(!visible)
  }

  return (
    <div
      css={css`
        display: flex;
        justify-content: flex-end;
      `}
    >
      <HamburgerIcon
        css={css`
          color: ${theme.colors.fontColor};
          margin: 1em;
          visibility: ${visible ? "hidden" : "visible"};
        `}
        onClick={toggleMenu}
      />
      <nav
        css={css`
          // display: ${visible ? "unset" : "none"};
          height: 100vh;
          position: fixed;
          z-index: 999;
          width: 30%;
          right: 0;
          top: 0;
          background: ${theme.colors.bgColor};
        `}
      >
        <CloseIcon
          css={css`
            position: fixed;
            right: 0;
            top: 0;
            color: ${theme.colors.fontColor};
            margin: 1em;
          `}
        />
        <ul
          css={css`
            li {
              cursor: pointer;
              padding: 2em 1em 2em 0;
              text-align: right;
              color: ${theme.colors.fontColor};

              &:first-child {
                margin-top: 3em;
              }

              &:hover {
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
    </div>
  )

  // return (
  //   <nav>
  //     <ul
  //       css={css`
  //         display: flex;
  //         justify-content: flex-end;
  //         list-style-type: none;

  //         li {
  //           cursor: pointer;
  //           padding: 0.5em;
  //           text-decoration: none;
  //           color: ${theme.colors.fgColor};
  //           &:hover {
  //             color: ${theme.colors.fontColor};
  //             font-weight: bold;
  //           }
  //         }
  //       `}
  //     >
  //       {navItems.map(v => (
  //         <li key={v.label} onClick={() => scrollIntoView(v.ref)}>
  //           {v.label}
  //         </li>
  //       ))}
  //     </ul>
  //   </nav>
  // )
}

export default NavBar
