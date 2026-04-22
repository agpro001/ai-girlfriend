import { Link } from 'react-router-dom';

/** Renders text with @username tokens as clickable profile links. */
export default function MentionText({ text }: { text: string }) {
  const parts = text.split(/(@\w+)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (/^@\w+$/.test(p)) {
          const username = p.slice(1);
          return (
            <Link key={i} to={`/u/${username}`} className="text-primary hover:underline font-medium">
              {p}
            </Link>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
