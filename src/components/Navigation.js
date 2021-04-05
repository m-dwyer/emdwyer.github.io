import React from "react"
import { css } from "@emotion/react"
import { Link } from "gatsby"

const Navigation = ({ previous, next }) => {
  return (
    <div
      css={css`
        display: flex;
        justify-content: space-between;
      `}
    >
      <div>
        {previous && (
          <Link
            to={previous.path}
            rel="prev"
            css={css`
              text-decoration: underline;
              font-weight: bold;
            `}
          >
            &#8592;{previous.label}
          </Link>
        )}
      </div>
      <div>
        {next && (
          <Link
            to={next.path}
            rel="next"
            css={css`
              text-decoration: underline;
              font-weight: bold;
            `}
          >
            {next.label}&#8594;
          </Link>
        )}
      </div>
    </div>
  )
}

export default Navigation
