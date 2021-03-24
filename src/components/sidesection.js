import { Link } from "gatsby"
import React from "react"
import { css } from "@emotion/core"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"

const SideSection = ({ left, right, to }) => {
  const base = css`
    width: 3em;
    height: 3em;
    position: absolute;
    top: 50%;
  `

  return (
    <Link to={to}>
      {left ? (
        <FaChevronLeft
          css={css`
            ${base};
            left: 0px;
          `}
        />
      ) : (
        <FaChevronRight
          css={css`
            ${base};
            right: 0px;
          `}
        />
      )}
    </Link>
  )
}

export default SideSection
