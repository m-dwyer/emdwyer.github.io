import React from "react"
import { css, Global } from "@emotion/core"

const GlobalStyles = () => {
  return (
    <Global
      styles={theme => css`
        @font-face {
          font-family: "Ubuntu";
          src: url("https://fonts.googleapis.com/css2?family=Ubuntu&display=swap");
        }

        html,
        body {
          margin: 0;
          padding: 0;
        }

        * {
          box-sizing: border-box;
        }

        body {
          font-family: "Ubuntu", sans-serif;
          background-color: ${theme.colors.bgColor};
          color: ${theme.colors.fontColor};
        }

        h1 {
          font-weight: 600;
          font-size: 4rem;
          text-align: center;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        ul {
          list-style-type: none;
          padding: 0;
        }
      `}
    />
  )
}

export default GlobalStyles
