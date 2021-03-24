import React from "react"
import { css, Global, useTheme } from "@emotion/react"

const GlobalStyles = () => {
  const theme = useTheme()

  console.log("THEME!:", theme)

  return (
    <Global
      styles={css`
        @import url("https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;700&family=Source+Code+Pro&display=swap");

        html,
        body {
          margin: 0;
          padding: 0;
        }

        * {
          box-sizing: border-box;
        }

        body {
          font-family: "Nunito Sans", sans-serif;
          background-color: ${theme.colors.bgColor};
          color: ${theme.colors.fontColor};
        }

        h1 {
          font-family: "Nunito Sans";
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
