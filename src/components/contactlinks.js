import React from "react"
import { FaGithub, FaLinkedin } from "react-icons/fa"

const ContactLinks = ({ contacts }) => {
  const ICON_SIZE = 40
  return (
    <>
      {contacts["linkedin"] && (
        <a
          href={contacts["linkedin"]}
          className="link"
          rel="noreferrer"
          target="_blank"
        >
          <FaLinkedin size={ICON_SIZE} />
        </a>
      )}
      {contacts["github"] && (
        <a
          href={contacts["github"]}
          className="link"
          rel="noreferrer"
          target="_blank"
        >
          <FaGithub size={ICON_SIZE} />
        </a>
      )}
    </>
  )
}

export default ContactLinks
