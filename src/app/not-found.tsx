import Link from "next/link";
export default function NotFound() {
  return <main className="fatal"><span aria-hidden="true">⌁</span><h1>Wrong turn.</h1><p>That page isn&apos;t in our neighborhood.</p><Link href="/">Back to the map</Link></main>;
}
