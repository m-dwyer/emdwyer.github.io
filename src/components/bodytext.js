import React from "react"
import { css } from "@emotion/react"

const BodyText = ({ content }) => {
  return (
    <>
      <div
        dangerouslySetInnerHTML={{ __html: content }}
        css={css`
          line-height: 1.6em;

          p {
            margin: 0 0 1.75em;
            line-height: 2em;
          }

          figcaption {
            text-align: center;
          }

          ul {
            list-style-type: initial;
            padding-left: 0.75em;
            margin-bottom: 2em;
          }

          ol {
            margin-bottom: 2em;
          }
        `}
      />
    </>
  )
}

export default BodyText
