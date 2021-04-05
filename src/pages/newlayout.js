import React from "react"
import { Global, css } from "@emotion/react"
import GlobalStyles from "../components/globalstyles"

const NewLayout = () => {
  return (
    <div
      css={css`
        display: grid;
        height: 100vh;
        width: 100%;
        grid-template-rows: max-content auto max-content;
        grid-template-columns: auto;
      `}
    >
      <Global
        css={css`
          body {
            padding: 0;
            margin: 0;
            box-sizing: border;
          }
        `}
      />
      <div
        css={css`
          background: red;
          grid-area: 1/1/2/2;

          display: flex;
          justify-content: space-between;
        `}
      >
        <div>Logo!</div>
        <div>Avatar!</div>
      </div>
      <div
        css={css`
          background: yellow;
          grid-area: 2/1/3/2;

          display: grid;
          grid-template-columns: auto 1fr;
        `}
      >
        <nav>
          <ul>
            <li>item 1</li>
            <li>item 2</li>
          </ul>
        </nav>
        <main
          css={css`
            background: orange;
          `}
        >
          aaaa
        </main>
      </div>
      <div
        css={css`
          background: green;
          grid-area: 3/1/4/2;
        `}
      >
        Footer
      </div>
    </div>
  )
}

export default NewLayout
