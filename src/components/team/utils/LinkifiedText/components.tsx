export const ExternalLink = ({ url }: { url: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="link text-secondary break-all">
      {url}
  </a>
)
