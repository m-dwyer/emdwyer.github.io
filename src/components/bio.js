import React, { useContext } from "react"
import { css } from "@emotion/react"
import { LayoutContext } from "./layout"

const Bio = () => {
  const { avatar } = useContext(LayoutContext)
  return (
    <div
      css={css`
        display: flex;
        margin-bottom: 2em;
      `}
    >
      <div
        css={css`
          margin-right: 1em;
        `}
      >
        {avatar}
      </div>
      <span>
        Written by mdwyer who is a developer and tech enthusiast living in
        Melbourne, Australia
      </span>
    </div>
  )
}

export default Bio
