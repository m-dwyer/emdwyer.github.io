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
          <Link to={previous.path} rel="prev">
            {previous.label}
          </Link>
        )}
      </div>
      <div>
        {next && (
          <Link to={next.path} rel="next">
            {next.label}
          </Link>
        )}
      </div>
    </div>
  )
}

export default Navigation
