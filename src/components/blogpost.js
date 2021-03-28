import React from "react"
import { css } from "@emotion/react"
import { FaCalendar } from "react-icons/fa"
import BlogNavigation from "./blognavigation"
import BodyText from "./bodytext"
import Bio from "./bio"
import _ from "lodash"

const BlogPost = props => {
  const { title, date, content, previous, next } = props
  return (
    <main>
      <article
        css={css`
          max-width: 50em;
          text-align: justify;
          margin: 0 auto;
        `}
      >
        <header
          css={css`
            margin-bottom: 2rem;
          `}
        >
          <h1
            css={css`
              text-align: left;
              margin-top: 2rem;
              margin-bottom: 0rem;
            `}
          >
            {title}
          </h1>
          <p
            css={css`
              margin-bottom: 4rem;
            `}
          >
            <FaCalendar
              css={css`
                margin: 0 10px 0 0;
              `}
            />
            {date}
          </p>
        </header>
        <section>
          <BodyText content={content} />
        </section>
        <footer
          css={css`
            margin-top: 2rem;
          `}
        >
          <Bio />
          <BlogNavigation previous={previous} next={next} />
        </footer>
      </article>
    </main>
  )
}

export default BlogPost
