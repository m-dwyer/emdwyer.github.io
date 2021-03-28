import React from "react"
import { css, useTheme } from "@emotion/react"

const BodyText = ({ content }) => {
  const theme = useTheme()
  return (
    <>
      <div
        dangerouslySetInnerHTML={{ __html: content }}
        css={css`
          line-height: 1.6em;

          p {
            margin: 0 0 1.75em;
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

          li {
            margin-bottom: 0.5em;
          }

          a {
            text-decoration: underline;
            color: ${theme.colors.highlightColor};
          }
        `}
      />
    </>
  )
}

export default BodyText
