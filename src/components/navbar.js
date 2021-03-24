import React, { useContext, useState } from "react"
import { css } from "@emotion/core"
import { useTheme } from "emotion-theming"

import { NavContext } from "./layout"

import HamburgerIcon from "../../static/hamburger.inline.svg"
import CloseIcon from "../../static/closemenu.inline.svg"

const NavBar = () => {
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

          @media (min-width: 480px) {
            visibility: hidden;
          }
        `}
        onClick={toggleMenu}
        onKeyDown={toggleMenu}
      />
      <nav
        css={css`
          background: ${theme.colors.bgColor};
          height: 100vh;
          position: fixed;
          z-index: 999;
          width: 40%;
          right: 0;
          top: 0;
          display: ${visible ? "unset" : "none"};

          @media (min-width: 480px) {
            display: flex;
            justify-content: flex-end;
            position: unset;
            background: none;
            height: unset;
            width: auto;

            ul {
              display: flex;
            }
          }
        `}
      >
        <CloseIcon
          css={css`
            position: fixed;
            right: 0;
            top: 0;
            color: ${theme.colors.fontColor};
            margin: 1em;

            @media (min-width: 480px) {
              visibility: hidden;
            }
          `}
          onClick={toggleMenu}
          onKeyDown={toggleMenu}
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

              @media (min-width: 480px) {
                text-align: center;
                padding: 1em 0.5em;
                height: 100%;
                :first-child {
                  margin-top: unset;
                }
              }
            }
          `}
        >
          {navItems.map((v, i) => (
            <li>
              <a
                href="#0"
                onClick={() => scrollIntoView(v.ref)}
                onKeyDown={() => scrollIntoView(v.ref)}
              >
                {v.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default NavBar
