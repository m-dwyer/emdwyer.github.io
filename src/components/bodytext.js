import React from "react"
import { css } from "@emotion/core"

const BodyText = ({ content }) => {
  return (
    <>
      <div
        dangerouslySetInnerHTML={{ __html: content }}
        css={css`
          line-height: 1.6em;
          p {
            margin: 0 0 3em;
          }

          ul {
            margin: 0 0 3em;
          }
        `}
      />
    </>
  )
}

export default BodyText
