import React from "react"
import { css } from "@emotion/core"

const IndexSection = ({ forwardedRef, children, ...props }) => {
  const ReferencedSection = React.forwardRef((props, ref) => {
    return (
      <section
        css={css`
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 100vh;
          justify-content: center;
          align-items: center;
          margin: auto;
        `}
        ref={ref}
        {...props}
      >
        {children}
      </section>
    )
  })

  return (
    <ReferencedSection ref={forwardedRef} {...props}>
      {children}
    </ReferencedSection>
  )
}

export default IndexSection
