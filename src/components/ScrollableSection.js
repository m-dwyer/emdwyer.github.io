import React, { useContext, useRef, useEffect } from "react"
import { NavContext } from "./layout"

const ScrollableSection = ({ navLabel, children, ...props }) => {
  const ReferencedSection = React.forwardRef((props, ref) => {
    return (
      <section ref={ref} {...props}>
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

export default ScrollableSection
