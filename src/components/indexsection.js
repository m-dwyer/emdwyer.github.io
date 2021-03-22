import React, { useContext, useEffect, useRef } from "react"
import { css } from "@emotion/core"

import { NavContext } from "./layout"

const IndexSection = ({ children, navLabel, ...props }) => {
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

  const { setNavItems } = useContext(NavContext)
  const ref = useRef(null)

  useEffect(() => {
    setNavItems({ label: navLabel, ref })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ReferencedSection ref={ref} {...props}>
      {children}
    </ReferencedSection>
  )
}

export default IndexSection
